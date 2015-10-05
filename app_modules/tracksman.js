/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * tracksman.js - Controller for audio and subtitles tracks
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var util         = require('util');
var EventEmitter = require('events');

/**
 * TracksMan
 *
 * @param { Player } player to bind to
 */
function TracksMan(player) {
  EventEmitter.call(this);
  this.mediaInfo = null;
  this.unloadAudioTracks();
  this.unloadSubtitlesTracks();
  this.tracksLoaded = false;
  this.activeAudioTrack = undefined;
  this.activeSubtitlesTrack = undefined;
  this.player = player;
  this.player.on('playing', (function(){
    if(!this.tracksLoaded) {
      this.loadAudioTracks();
      this.loadSubtitlesTracks();
      this.tracksLoaded = true;
      this.emit('playing');
    }
  }).bind(this));
  this.player.on('stopped', (function(){
    this.unloadAudioTracks();
    this.unloadSubtitlesTracks();
    this.tracksLoaded = false;
  }).bind(this));
}
util.inherits(TracksMan, EventEmitter);

module.exports = TracksMan;

TracksMan.prototype.loadAudioTracks = function() {
  this.unloadAudioTracks();
  var audio = this.player.getAudio();
  for(var i=1 ; i<audio.count ; i++) {
    this.audioTracks.push({
      type : 'internal',
      track: i,
      name : audio[i],
      lang : this.detectLang(audio[i]),
    });
  }
  this.emit('audio');
}
TracksMan.prototype.unloadAudioTracks = function () {
  this.audioTracks = [];
  this.emit('audio');
}
// invalid index disable audio
// return active audio track
TracksMan.prototype.audio = function (index) {
  if(typeof index != 'undefined') {
    var audio = this.audioTracks[index];
    if(audio && audio.type == 'internal') {
      this.player.audio(audio.track);
      this.activeAudioTrack = index;
    } else {
      this.player.audio(-1);
      this.activeAudioTrack = undefined;
    }
    this.emit('audio');
  }
  return this.activeAudioTrack;
}
TracksMan.prototype.audioTrack = function () {
  return this.audioTracks[this.activeAudioTrack];
}

TracksMan.prototype.loadSubtitlesTracks = function() {
  this.unloadSubtitlesTracks();
  var subtitles = this.player.getSubtitles();
  for(var i=1 ; i<subtitles.count ; i++) {
    this.subtitlesTracks.push({
      type : 'internal',
      track: i,
      name : subtitles[i],
      lang : this.detectLang(subtitles[i]),
    });
  }
  this.emit('subtitles');
}
TracksMan.prototype.unloadSubtitlesTracks = function () {
  this.subtitlesTracks = [];
  this.emit('subtitles');
}
// invalid index disable subtitles
// return active subtitles track
TracksMan.prototype.subtitles = function (index) {
  if(typeof index != 'undefined') {
    this.player.stopExternalSubtitle();
    this.player.subtitles(-1);
    var subtitle = this.subtitlesTracks[index];
    if(subtitle) {
      if(subtitle.type == 'internal') {
        this.player.subtitles(subtitle.track);
        this.activeSubtitlesTrack = index;
      } else if(subtitle.type == 'opensubtitles.org') {
        this.player.subtitles(subtitle.url);
        this.activeSubtitlesTrack = index;
      } else if(subtitle.type == 'manual') {
        this.player.subtitles(subtitle.uri);
        this.activeSubtitlesTrack = index;
      } else {
        this.activeSubtitlesTrack = undefined;
      }
    }
    this.emit('subtitles');
  }
  return this.activeSubtitlesTrack;
}
TracksMan.prototype.subtitlesTrack = function () {
  return this.subtitlesTrack[this.activeSubtitlesTrack];
}
TracksMan.prototype.addSubtitles = function (uri) {
  this.subtitlesTracks.push({
    type: 'manual',
    uri : uri,
    name: uri,
  });
  this.emit('subtitles');
}
TracksMan.prototype.searchSubtitles = function (lang, searchLevel, cb) {
  var query = {};
  if(searchLevel <= 1) {
    if(this.mediaInfo.os_hash) {
      query.hash = this.mediaInfo.os_hash;
    } else {
      query.path = this.mediaInfo.filepath;
    }
  }
  if(searchLevel <= 2) {
    query.imdbid  = this.mediaInfo.imdb_id;
    query.episode = this.mediaInfo.episode_nb;
    query.season  = this.mediaInfo.season_nb;
  }
  if(searchLevel <= 3) {
    query.sublanguageid = lang;
    query.filename = this.mediaInfo.filename;
  }
  (new (require('opensubtitles-api'))('OSTestUserAgent'))
  .search(query).then((function (subtitles) {
    var foundSubs = false;
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
        this.subtitlesTracks.push({
          type: 'opensubtitles.org',
          url : sub.url,
          name: sub.langName,
          lang: lang,
        });
        this.emit('subtitles');
        foundSubs = true;
      }
    }
    if(typeof cb == 'function') cb(foundSubs);
  }).bind(this));
}

TracksMan.prototype.detectLang = function (name) {
  var langmap = require('langmap');
  for(var locale in langmap) {
    if(name.indexOf(langmap[locale]["englishName"])!==-1) {
      return locale.split('-')[0];
    }
  }
  for(var locale in langmap) {
    if(name.indexOf(langmap[locale]["nativeName"])!==-1) {
      return locale.split('-')[0];
    }
  }
  for(var locale in langmap) {
    if(name.indexOf(locale)!==-1) {
      return locale.split('-')[0];
    }
  }
  for(var locale in langmap) {
    var lang = locale.split('-')[0]
    if(name.indexOf(lang)!==-1) {
      return lang;
    }
  }
}
