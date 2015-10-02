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
      this.setCurrentLoadedAudio(0);
    }
    this.loadSubtitlesForLocaleIfNeeded();
    this.emit('playing');
  }).bind(this);

  this.vlc.onStopped = (function() {
    this.unloadAudio();
    this.unloadSubtitles();
    this.subtitlesSearchLevel = 0;
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

  this.subtitlesSearchLevel = 0;

  this.OpenSubtitles = new (require('opensubtitles-api'))('OSTestUserAgent');

  // init media info

  this.currentMediaInfo = null;
}
util.inherits(Player, EventEmitter);

module.exports = Player;

/**
 * App - Respond to command
 *
 * @param cmd  { string } - command identifier
 * @param args { array  } - command arguments
 *
 * Supported commands : • play(uri|MediaInfo, [locale])
 *                      • play
 *                      • pause
 *                      • togglePause
 *                      • stop
 *                      • seek(time in ms)
 *                      • jump(delta in ms)
 *                      • setAudioTrack(track number)
 *                      • volume(value)
 *                      • mute
 *                      • unmute
 *                      • toggleMute
 *                      • setSubtitlesTrack(track number)
 *                      • setSubtitlesFile(path or url, [encoding])
 *                      • nextAudio([locale])
 *                      • nextSubtitles([locale])
 *                      • setLoadedAudio(index)
 *                      • setLoadedSubtitles(index)
 */
Player.prototype.cmd = function (cmd) {

  var args = Array.prototype.slice.call(arguments);
  args.shift();

  if(cmd == 'play') {

    // play from given data
    // calling without args resumes playing, if possible

    var src = args[0];
    var loc = args[1];

    if(src) {

      if(typeof src == 'string') {
        this.currentMediaInfo = new (require('../app_modules/mediainfo'))();
        this.currentMediaInfo.uri = src;
      } else {
        this.currentMediaInfo = src;
      }
      this.playFromCurrentMediaInfo(loc);

    } else {
      this.vlc.play();
    }

  } else if(cmd == 'pause') {
    this.vlc.pause();

  } else if(cmd == 'togglePause') {
    this.vlc.togglePause();

  } else if(cmd == 'stop') {
    this.vlc.stop();

  } else if(cmd == 'seek') {
    this.vlc.time = +args[0];

  } else if(cmd == 'jump') {
    this.vlc.time = this.vlc.time + args[0];

  } else if(cmd == 'setAudioTrack') {
    this.vlc.audio.track = args[0];

  } else if(cmd == 'volume') {
    this.vlc.volume = +args[0];

  } else if(cmd == 'mute') {
    this.vlc.mute = true;

  } else if(cmd == 'unmute') {
    this.vlc.mute = false;

  } else if(cmd == 'toggleMute') {
    this.vlc.toggleMute();

  } else if(cmd == 'setSubtitlesTrack') {
    this.vlc.subtitles.track = args[0];

  } else if (cmd == 'setSubtitlesFile') {

    // load subtitle file from local path or url
    // second arg is the file encoding (optional)

    var uri      = args[0];
    var encoding = args[1];

    if (uri) {
      this.loadedSubtitles.push({
        type: 'manual',
        uri : uri,
        name: uri,
      });
      this.setCurrentLoadedSubtitles(this.loadedSubtitles.length-1);
    }

  } else if (cmd == 'nextAudio') {

    var locale = args[0];
    this.setNextBestAudioForLocale(locale);

  } else if (cmd == 'nextSubtitles') {

    var locale = args[0];
    this.setNextBestSubtitlesForLocale(locale);

  } else if (cmd == 'setLoadedAudio') {

    var index = args[0];
    this.setCurrentLoadedAudio(index);

  } else if (cmd == 'setLoadedSubtitles') {

    var index = args[0];
    this.setCurrentLoadedSubtitles(index);
  }
}

/**
 * init preferred subtitles and audio based on given locale (optional)
 */
Player.prototype.playFromCurrentMediaInfo = function (locale) {

  var mrl = this.currentMediaInfo.mrl;
  if(mrl) {
    this.vlc.play(mrl);
    this.audioActiveLocale = locale;
    this.subtitlesActiveLocale = locale;
    return;
  }

  var uri = this.currentMediaInfo.uri;
  if (uri.startsWith('magnet:') || uri.endsWith('.torrent')) {

    require('../app_modules/torrent').createStreamFromTorrent(uri, (function(err, stream) {
      if(err) return;
      this.currentMediaInfo.mrl = stream.url;
      this.playFromCurrentMediaInfo(locale);
    }).bind(this));

  } else {

    if (uri.startsWith('http://')) {
      this.currentMediaInfo.mrl = uri;
    } else {
      if(uri.startsWith('file://')) {
        this.currentMediaInfo.mrl = uri;
        this.currentMediaInfo.filepath = uri.substr('file://'.length);
      } else {
        this.currentMediaInfo.mrl = 'file://'+uri;
        this.currentMediaInfo.filepath = uri;
      }
      this.currentMediaInfo.filename = this.currentMediaInfo.filepath.split('/').pop();
    }
    this.playFromCurrentMediaInfo(locale);
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

Player.prototype.stopExternalSubtitle = function () {

  this.updateSubtitles(-1);
  this.updateSubtitles = function(){};
  this.writeSubtitle('');
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

  if(!Number.isInteger(this.subtitlesDiscoveryIndex)) this.subtitlesDiscoveryIndex = -1;
  if(this.subtitlesDiscoveryIndex >= this.loadedSubtitles.length-1) {

    // search levels :
    // 1 : OpenSubtitles by file hash
    // 2 : OpenSubtitles by imdb
    // 3 : OpenSubtitles by filename

    if(!Number.isInteger(this.subtitlesSearchLevel)) this.subtitlesSearchLevel = 0;
    if(this.subtitlesSearchLevel < 3) {

      this.subtitlesSearchLevel ++ ;

      this.searchAndLoadSubtitlesForLocale(locale, (function(){
        this.setNextBestSubtitlesForLocale(locale);
      }).bind(this));

    } else {
      console.log('cannot find more subs');
    }

    return;
  }

  this.subtitlesDiscoveryIndex ++ ;
  this.setCurrentLoadedSubtitles(this.subtitlesDiscoveryIndex);
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
 * @return { number } index of current loaded audio
 */
Player.prototype.getCurrentLoadedAudio = function () {
  return this.audioActiveIndex;
}

/**
 * @param index { number } index in this.loadedAudio
 * invalid value disables audio
 */
Player.prototype.setCurrentLoadedAudio = function (index) {

  // use existing audioActiveIndex if index omitted
  // check for number type to allow 0
  if(typeof index == 'number') this.audioActiveIndex = index;

  var audio = this.loadedAudio[this.audioActiveIndex];
  if(audio && audio.type == 'internal') {
    this.cmd('setAudioTrack', audio.internalIndex);
  } else {
    this.cmd('setAudioTrack', -1);
  }
  this.emit('loadedAudioChanged');
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
 * @return { number } index of current loaded subtitles
 */
Player.prototype.getCurrentLoadedSubtitles = function () {
  return this.subtitlesActiveIndex;
}

/**
 * @param index { number } index in this.loadedSubtitles
 * invalid value disables subtitles
 */
Player.prototype.setCurrentLoadedSubtitles = function (index) {

  // disable any running subtitle
  this.stopExternalSubtitle();
  this.cmd('setSubtitlesTrack', -1);

  // use existing subtitlesActiveIndex if index omitted
  // check for number type to allow 0
  if(typeof index == 'number') this.subtitlesActiveIndex = index;

  var subtitle = this.loadedSubtitles[this.subtitlesActiveIndex];
  if(subtitle) {
    if(subtitle.type == 'internal') {
      this.cmd('setSubtitlesTrack', subtitle.internalIndex);
    } else if(subtitle.type == 'opensubtitles.org') {
      this.setSubtitlesFile(subtitle.url);
    } else if(subtitle.type == 'manual') {
      this.setSubtitlesFile(subtitle.uri);
    }
  }
  this.emit('loadedSubtitlesChanged');
}

/**
 * @return { WebChimera.VlcMedia }
 */
Player.prototype.getCurrentPlaylistItem = function () {
  var index = this.vlc.playlist.currentItem;
  return this.vlc.playlist.items[index];
}

/**
 * @return media length in ms
 */
Player.prototype.getLength = function () {
  return this.vlc.length;
}

/**
 * @return current time in ms
 */
Player.prototype.getTime = function () {
  return this.vlc.time;
}

/**
 * @return current position in [0,1]
 */
Player.prototype.getPosition = function () {
  return this.vlc.position;
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

  this.emit('loadedAudioChanged');
}

Player.prototype.unloadAudio = function () {

  this.loadedAudio = [];
  this.audioActiveIndex = undefined;

  this.emit('loadedAudioChanged');
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

  this.emit('loadedSubtitlesChanged', this.subtitlesActiveIndex);
}

Player.prototype.unloadSubtitles = function () {

  this.loadedSubtitles = [];
  this.subtitlesActiveIndex = undefined;
  this.subtitlesDiscoveryIndex = undefined;

  this.emit('loadedSubtitlesChanged');
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

  if(userLocale) {
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
  } else {
    var acceptedLocales = [];
    var acceptedItems = [];
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

Player.prototype.searchAndLoadSubtitlesForLocale = function (locale, callback) {

  // search returns immediately if locale is not defined,
  // lang cannot be extracte, or media info are not available

  if(!this.audioActiveLocale) {
    if(typeof callback == 'function') callback();
    return;
  }

  var lang = this.audioActiveLocale.split('-')[0];
  if(!lang) {
    if(typeof callback == 'function') callback();
    return;
  }

  if(!this.currentMediaInfo) {
    if(typeof callback == 'function') callback();
    return;
  }

  var query = {};

  if(this.subtitlesSearchLevel <= 1) {

    query.path = this.currentMediaInfo.filepath;
  }
  if(this.subtitlesSearchLevel <= 2) {

    query.imdbid  = this.currentMediaInfo.imdb_id;
    query.episode = this.currentMediaInfo.episode_nb;
    query.season  = this.currentMediaInfo.season_nb;
  }
  if(this.subtitlesSearchLevel <= 3) {

    query.sublanguageid = lang;
    query.filename = this.currentMediaInfo.filename;
  }
  if(this.subtitlesSearchLevel <= 4) {

    query.query = null;
  }

  this.OpenSubtitles.search(query).then((function (subtitles) {

    console.log(subtitles);

    if(lang in subtitles) {

      var sub = subtitles[lang];

      var found = false;
      // TODO with a real OpenSubtitles account
      // for(var i=0 ; i<this.loadedSubtitles.length ; i++) {
      //   if() {
      //     found = true;
      //     break;
      //   }
      // }

      if(!found) {
        this.loadedSubtitles.push({
          type: 'opensubtitles.org',
          url : sub.url,
          name: sub.langName,
        });
        this.emit('loadedSubtitlesChanged');
      }
    }

    if(typeof callback == 'function') callback();

  }).bind(this));
}
