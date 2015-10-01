/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * player.js - Wrapper for WebChimera renderer
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

var util         = require('util');
var EventEmitter = require('events');

/**
 * Player
 * inherits EventEmitter
 *
 * @param root { HTMLElement } - root element to find player components in
 */
function Player(root) {
  EventEmitter.call(this);

  // get ui elements

  this.uiRoot         = root;
  this.uiCanvas       = root.querySelector('.playerCanvas');
  this.uiSubtitlesBox = root.querySelector('.playerSubtitlesBox');

  // init WebChimera renderer

  var wcjs = require("../node_modules_hacked/wcjs-renderer");
  this.vlc = wcjs.init(this.uiCanvas);

  // map WebChimera callbacks to EventEmitter events for convenience

  this.vlc.onPlaying = (function() {
    this.emit('playing');
  }).bind(this);

  this.vlc.onStopped = (function() {
    this.emit('stopped');
  }).bind(this);

  this.vlc.onTimeChanged = (function(time) {
    this.emit('timeChanged', time);
  }).bind(this);

  // init subtitles player

  this.updateSubtitles = function(){};
  this.on('timeChanged', (function(time) {
    this.updateSubtitles(time/1000);
  }).bind(this));

  // init subtitles manager

  this.loadedSubtitles = [];
  this.subtitlesActiveIndex = undefined;
  this.subtitlesActiveLocale = undefined;

  // init audio manager

  this.loadedAudioTracks = [];
  this.audioActiveIndex = undefined;
  this.audioActiveLocale = undefined;
}
util.inherits(Player, EventEmitter);

module.exports = Player;

/**
 * @return { WebChimera.VlcMedia }
 */
Player.prototype.getCurrentPlaylistItem = function () {
  var index = this.vlc.playlist.currentItem;
  return this.vlc.playlist.items[index];
}

/**
 * @return { WebChimera.VlcAudio }
 * NB: .count returns the number of tracks
 *     [i] returns the ith track
 */
Player.prototype.getAudio = function () {
  return this.vlc.audio;
}

/**
 * @return { number }
 */
Player.prototype.getCurrentAudioTrack = function () {
  return this.getAudio().track;
}

/**
 * @return { WebChimera.VlcSubtitles }
 * NB: .count returns the number of tracks
 *     [i] returns the ith track
 */
Player.prototype.getSubtitles = function () {
  return this.vlc.subtitles;
}

/**
 * @return { number }
 */
Player.prototype.getCurrentSubtitlesTrack = function () {
  return this.getSubtitles().track;
}

/**
 * App - Respond to command
 *
 * @param cmd  { string } - command identifier
 * @param args { array  } - command arguments
 *
 * Supported commands : • play(uri)
 *                      • play
 *                      • pause
 *                      • togglePause
 *                      • stop
 *                      • jump(delta in ms)
 *                      • setAudioTrack(track number)
 *                      • toggleMute
 *                      • setSubtitlesTrack(track number)
 *                      • setSubtitlesFile(path or url, encoding)
 */
Player.prototype.cmd = function (cmd) {

  var args = Array.prototype.slice.call(arguments);
  args.shift();

  if(cmd == 'play') {

    // play given uri
    // calling without args resumes playing, if possible

    var uri = args[0];

    if(uri) {
      this.playURI(uri);
    } else {
      this.vlc.play();
    }

  } else if(cmd == 'pause') {
    this.vlc.pause();

  } else if(cmd == 'togglePause') {
    this.vlc.togglePause();

  } else if(cmd == 'stop') {
    this.vlc.stop();

  } else if(cmd == 'jump') {
    this.vlc.time = this.vlc.time + args[0];

  } else if(cmd == 'setAudioTrack') {
    this.vlc.audio.track = args[0];

  } else if(cmd == 'toggleMute') {
    this.vlc.toggleMute();

  } else if(cmd == 'setSubtitlesTrack') {
    this.vlc.subtitles.track = args[0];

  } else if (cmd == 'setSubtitlesFile') {

    // load subtitle file from local path or url
    // second arg is the file encoding
    // calling with no args unload the current file

    var uri      = args[0];
    var encoding = args[1];

    if (uri) {
      this.setSubtitlesFile(uri, encoding);

    } else {
      this.updateSubtitles(-1);
      this.updateSubtitles = function(){};
      this.writeSubtitle('');
    }
  }
}

/**
 * Play local path to file, .torrent, URL, or magnet link
 */
Player.prototype.playURI = function (uri) {

  if (uri.startsWith('magnet:') || uri.endsWith('.torrent')) {

    require('../app_modules/torrent').createStreamFromTorrent(uri, (function(err, stream) {
      if(err) return;
      this.cmd('play', stream.url);
    }).bind(this));

  } else {

    if (uri.startsWith('http://')) {
      this.vlc.play(uri);

    } else {
      this.vlc.play(uri.startsWith('file://') ? uri : 'file://'+uri);
    }
  }
}

/**
 * Setup subtitles from local path or URL
 * try to detect encoding if omitted
 */
Player.prototype.setSubtitlesFile = function (uri, encoding) {

  if (uri.startsWith('http://')) {

    var dir = '/tmp/arnold/srt';
    var name = new Date().getTime() + '.srt';
    var path = dir+'/'+name;

    new (require('download'))()
    .get(uri)
    .dest(dir)
    .rename(name)
    .run((function() {
      this.setSubtitlesFile(path, encoding);
    }).bind(this));

  } else {

    require('fs').readFile(uri, (function(err, buffer) {
      if(err) return;
      if(!encoding) {
        var matches = require('charset-detector')(buffer);
        encoding = matches[0] && matches[0].charsetName;
      }
      try {
        var text = require('legacy-encoding').decode(buffer, encoding);
      } catch(e) {
        console.log(e);
        var text = buffer.toString();
      }
      this.updateSubtitles = require('subplay')(text, (function(text) {
        this.writeSubtitle(text);
      }).bind(this));
    }).bind(this));
  }
}

/**
 * Write given subtitle item on screen
 */
Player.prototype.writeSubtitle = function (text) {
  this.uiSubtitlesBox.innerHTML = text;
}

/**
 * @param userLocale { string } e.g. 'fr-FR', 'fr', 'en', etc.
 * each call will switch to the next best audio track
 */
Player.prototype.setNextBestAudioForLocale = function(locale) {

  if(locale != this.audioActiveLocale) {

    this.loadedAudioTracks = [];
    this.audioActiveIndex = undefined;
    this.audioActiveLocale = locale;
  }

  if(this.loadedAudioTracks.length == 0) {

    var sortedAudioIndexes = this.sortTracksForLocale(
      this.getAudio(),
      this.audioActiveLocale
    );

    for(var i=0 ; i<sortedAudioIndexes.length ; i++) {
      this.loadedAudioTracks.push({
        type: 'internal',
        internalIndex: sortedAudioIndexes[i],
        name: this.getAudio()[sortedAudioIndexes[i]],
      });
    }
  }

  this.audioActiveIndex ++ ;
  if(Number.isNaN(this.audioActiveIndex)) this.audioActiveIndex = 0;

  if(this.audioActiveIndex == this.getAudio().count) {
    this.audioActiveIndex = 0;
  }

  var audio = this.loadedAudioTracks[this.audioActiveIndex];
  if(audio && audio.type == 'internal') {
    this.cmd('setAudioTrack', audio.internalIndex);
  }
}

/**
 * @param userLocale { string } e.g. 'fr-FR', 'fr', 'en', etc.
 * each call will switch to the next best subtitle
 */
Player.prototype.setNextBestSubtitleForLocale = function(locale) {

  if(locale != this.subtitlesActiveLocale) {

    this.loadedSubtitles = [];
    this.subtitlesActiveIndex = undefined;
    this.subtitlesActiveLocale = locale;
  }

  if(this.loadedSubtitles.length == 0) {

    var sortedSubtitlesIndexes = this.sortTracksForLocale(
      this.getSubtitles(),
      this.subtitlesActiveLocale
    );

    for(var i=0 ; i<sortedSubtitlesIndexes.length ; i++) {
      this.loadedSubtitles.push({
        type: 'internal',
        internalIndex: sortedSubtitlesIndexes[i],
        name: this.getSubtitles()[sortedSubtitlesIndexes[i]],
      });
    }
  }

  this.cmd('setSubtitlesTrack', -1);  // disable current track

  this.subtitlesActiveIndex ++ ;
  if(Number.isNaN(this.subtitlesActiveIndex)) this.subtitlesActiveIndex = 0;

  if(this.subtitlesActiveIndex == this.getSubtitles().count) {
    console.log("no more subs");
    return;
  }

  var subtitle = this.loadedSubtitles[this.subtitlesActiveIndex];
  if(subtitle && subtitle.type == 'internal') {
    this.cmd('setSubtitlesTrack', subtitle.internalIndex);
  }
}

/**
 * @param tracks { WebChimera.VlcAudio | WebChimera.VlcSubtitles }
 * @param userLocale { string } e.g. 'fr-FR', 'fr', 'en', etc.
 *
 * @returns { array } sorted tacks indexes, preffered track first
 */
Player.prototype.sortTracksForLocale = function (tracks, userLocale) {

  // extract lang from user locale
  // and find locales with the same lang

  var userLang = userLocale.split('-')[0];

  var langmap = require('langmap');

  var acceptedLocales = [ userLocale ]; // put user locale as first item
  var acceptedItems = [ langmap[userLocale] ];

  for(var locale in langmap) {
    if(locale != userLocale && locale.split('-')[0] == userLang) {
      acceptedLocales.push(locale);
      acceptedItems.push(langmap[locale]);
    }
  }

  // compute score for each track
  // desired output must respect the following :
  //
  // - match on locale's english or native name is preffered over match on abbrevation,
  //   regardless if the locale is the user locale or a compatible locale ;
  // - match on abbreviation is preferred over no match at all ;
  // - match on user locale is preferred over match on a compatible locale
  // - match on a compatible locale is equally preferred over a match on another compatible locale
  //
  // here is the scoring function implemented below :
  //
  //   |> match on english or native name (4) or none (0)
  //   |   |> match on user locale (2) or compatible locale (0)
  //   |   |   |> match on abbreviation (1) or not (0)
  //   0 + 0 + 0  = 0  --\
  //   0 + 0 + 1  = 1     > these two does not match to anything and get 0
  //   0 + 2 + 0  = 0  --/
  //   0 + 2 + 1  = 3
  //   4 + 0 + 0  = 4
  //   4 + 0 + 1  = 5
  //   4 + 2 + 0  = 6
  //   4 + 2 + 1  = 7

  var scores = [ null ];  // will contain one score for each track with corresponding indexes
                          // skip track 0 which is always the 'disable' track
  for(var i=1 ; i<tracks.count ; i++) {

    var trackScores = []; // store scores for this track for each locales

    for(var j=0 ; j<acceptedItems.length ; j++) {

      // match on english or native name brings 4,
      // match on the abbreviation brings 1

      var matchScore = 0;

      if(tracks[i].indexOf(acceptedItems[j]["englishName"]) != -1
      || tracks[i].indexOf(acceptedItems[j]["nativeName"]) != -1 ) {
        matchScore = 4;
      }
      if(tracks[i].indexOf(acceptedLocales[j]) != -1) {
        matchScore = 1;
      }

      // match on the user locale brings 2,
      // match on a compatible locale brings 0

      var isUserLocale = j == 0;  // user locale is the first in the list

      var localeScore = isUserLocale ? 2 : 0;

      // matching score of 0 nulls the total score

      trackScores.push(matchScore != 0
        ? matchScore + localeScore
        : 0
      );
    }

    // final score for this track is the max of scores for each locales
    // i.e. if it has a good score for one locale,
    // we don't care if it has a lesser score for another locale

    scores.push(Math.max.apply(null,trackScores));
  }

  // sort tracks indexes by score, greatest score first

  var indexes = [];
  // skip track 0 which is always the 'disable' track
  for(var i=1 ; i<tracks.count ; i++) indexes.push(i);

  var sortedTracks = indexes.sort(function(a,b){
    return scores[a] == scores[b]
      ? 0
      : scores[a] > scores[b] // greatest score comes first
        ? -1
        : +1
    ;
  });

  return sortedTracks;
}
