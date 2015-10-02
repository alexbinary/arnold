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
    // load audio and subs when media starts playing
    // do nothing when resuming playing from paused
    if(this.loadAudioForLocaleIfNeeded()) {
      // if audio was reloaded, setup first track
      this.setNextBestAudioForLocale();
    }
    this.loadSubtitlesForLocaleIfNeeded();
    this.emit('playing');
  }).bind(this);

  this.vlc.onStopped = (function() {
    this.unloadAudio();
    this.unloadSubtitles();
    this.emit('stopped');
  }).bind(this);

  this.vlc.onTimeChanged = (function(time) {
    this.updateSubtitles(time/1000);
    this.emit('timeChanged', time);
  }).bind(this);

  // init subtitles player

  this.updateSubtitles = function(){};

  // init audio and subtitles manager

  this.unloadAudio();
  this.audioActiveLocale = undefined;

  this.unloadSubtitles();
  this.subtitlesActiveLocale = undefined;
}
util.inherits(Player, EventEmitter);

module.exports = Player;

/**
 * App - Respond to command
 *
 * @param cmd  { string } - command identifier
 * @param args { array  } - command arguments
 *
 * Supported commands : • play(uri, [locale])
 *                      • play
 *                      • pause
 *                      • togglePause
 *                      • stop
 *                      • jump(delta in ms)
 *                      • setAudioTrack(track number)
 *                      • toggleMute
 *                      • setSubtitlesTrack(track number)
 *                      • setSubtitlesFile(path or url, [encoding])
 *                      • nextAudio([locale])
 *                      • nextSubtitles([locale])
 */
Player.prototype.cmd = function (cmd) {

  var args = Array.prototype.slice.call(arguments);
  args.shift();

  if(cmd == 'play') {

    // play given uri with given locale
    // calling without args resumes playing, if possible

    var uri = args[0];
    var loc = args[1];

    if(uri) {
      this.playURI(uri, loc);
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

  } else if (cmd == 'nextAudio') {

    var locale = args[0];
    this.setNextBestAudioForLocale(locale);

  } else if (cmd == 'nextSubtitles') {

    var locale = args[0];
    this.setNextBestSubtitlesForLocale(locale);
  }
}

/**
 * Play local path to file, .torrent, URL, or magnet link
 * init preferred subtitles and audio based on given locale (optional)
 */
Player.prototype.playURI = function (uri, locale) {

  if (uri.startsWith('magnet:') || uri.endsWith('.torrent')) {

    require('../app_modules/torrent').createStreamFromTorrent(uri, (function(err, stream) {
      if(err) return;
      this.playURI(stream.url, locale);
    }).bind(this));

  } else {

    if (uri.startsWith('http://')) {
      this.vlc.play(uri);

    } else {
      this.vlc.play(uri.startsWith('file://') ? uri : 'file://'+uri);
    }

    this.audioActiveLocale = locale;
    this.subtitlesActiveLocale = locale;
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
 * @param userLocale { string } e.g. 'fr-FR', 'fr', 'en', etc.
 * each call will switch to the next best audio track
 * circle back to first track if called on the last
 * if locale is omitted last defined is used
 */
Player.prototype.setNextBestAudioForLocale = function(locale) {

  // reload everything if locale changed
  // uses existing audioActiveLocale if locale omitted
  if(locale && locale != this.audioActiveLocale) {

    this.unloadAudio();
    this.audioActiveLocale = locale;
  }

  this.loadAudioForLocaleIfNeeded(this.audioActiveLocale);

  this.audioActiveIndex ++ ;
  if(Number.isNaN(this.audioActiveIndex)) this.audioActiveIndex = 0;

  if(this.audioActiveIndex == this.loadedAudio.length) {
    this.audioActiveIndex = 0;  // circle back to first track
  }

  var audio = this.loadedAudio[this.audioActiveIndex];
  if(audio && audio.type == 'internal') {
    this.cmd('setAudioTrack', audio.internalIndex);
  }
}

/**
 * @param userLocale { string } e.g. 'fr-FR', 'fr', 'en', etc.
 * each call will switch to the next best subtitle
 * if locale is omitted last defined is used
 */
Player.prototype.setNextBestSubtitlesForLocale = function(locale) {

  // reload everything if locale changed
  // uses existing subtitlesActiveLocale if locale omitted
  if(locale && locale != this.subtitlesActiveLocale) {

    this.unloadSubtitles();
    this.subtitlesActiveLocale = locale;
  }

  this.loadSubtitlesForLocaleIfNeeded(this.subtitlesActiveLocale);

  this.cmd('setSubtitlesTrack', -1);  // disable current track

  this.subtitlesActiveIndex ++ ;
  if(Number.isNaN(this.subtitlesActiveIndex)) this.subtitlesActiveIndex = 0;

  if(this.subtitlesActiveIndex == this.loadedSubtitles.length) {
    console.log("no more subs");
    return;
  }

  var subtitle = this.loadedSubtitles[this.subtitlesActiveIndex];
  if(subtitle && subtitle.type == 'internal') {
    this.cmd('setSubtitlesTrack', subtitle.internalIndex);
  }
}

/**
 * @return { array of objects } - type: 'internal',
 *                                internalIndex: { number },
 *                                name: { string },
 */
Player.prototype.getLoadedAudio = function () {
  return this.loadedAudio;
}

/**
 * @return { array of objects } - type: 'internal',
 *                                internalIndex: { number },
 *                                name: { string },
 */
Player.prototype.getLoadedSubtitles = function () {
  return this.loadedSubtitles;
}

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
 * Write given subtitle item on screen
 */
Player.prototype.writeSubtitle = function (text) {
  this.uiSubtitlesBox.innerHTML = text;
}

/**
 * @return { bool } true if audio has been loaded, false otherwise
 */
Player.prototype.loadAudioForLocaleIfNeeded = function (locale) {

  if(!this.loadedAudio || this.loadedAudio.length == 0) {
    this.loadAudioForLocale(locale);
    return true;
  }
  return false;
}

/**
 * use existing audioActiveLocale if no locale specified
 * reset audioActiveIndex
 */
Player.prototype.loadAudioForLocale = function (locale) {

  if(locale) this.audioActiveLocale = locale;

  var sortedAudioIndexes = this.sortTracksForLocale(
    this.getAudio(),
    this.audioActiveLocale
  );

  this.loadedAudio = [];
  for(var i=0 ; i<sortedAudioIndexes.length ; i++) {
    this.loadedAudio.push({
      type: 'internal',
      internalIndex: sortedAudioIndexes[i],
      name: this.getAudio()[sortedAudioIndexes[i]],
    });
  }
  this.audioActiveIndex = undefined;
}

Player.prototype.unloadAudio = function () {

  this.loadedAudio = [];
  this.audioActiveIndex = undefined;
}

/**
 * @return { bool } true if subtitles have been loaded, false otherwise
 */
Player.prototype.loadSubtitlesForLocaleIfNeeded = function (locale) {

  if(!this.loadedSubtitles || this.loadedSubtitles.length == 0) {
    this.loadSubtitlesForLocale(locale);
    return true;
  }
  return false;
}

/**
 * use existing subtitlesActiveLocale if no locale specified
 * reset subtitlesActiveIndex
 */
Player.prototype.loadSubtitlesForLocale = function (locale) {

  if(locale) this.subtitlesActiveLocale = locale;

  var sortedSubtitlesIndexes = this.sortTracksForLocale(
    this.getSubtitles(),
    this.subtitlesActiveLocale
  );

  this.loadedSubtitles = [];
  for(var i=0 ; i<sortedSubtitlesIndexes.length ; i++) {
    this.loadedSubtitles.push({
      type: 'internal',
      internalIndex: sortedSubtitlesIndexes[i],
      name: this.getSubtitles()[sortedSubtitlesIndexes[i]],
    });
  }
  this.subtitlesActiveIndex = undefined;
}

Player.prototype.unloadSubtitles = function () {

  this.loadedSubtitles = [];
  this.subtitlesActiveIndex = undefined;
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
