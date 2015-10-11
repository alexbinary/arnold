/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * player.js - Wrapper for WebChimera renderer
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var util         = require('util');
var EventEmitter = require('events');

/**
 * Player
 *
 * @param root  { HTMLElement } - root element to find player components in
 * @param Event { Event       } - DOM 'Event' interface
 */
function Player(root, Event) {
  EventEmitter.call(this);

  this.Event = Event;

  // UI elements
  this.uiRoot         = root;
  this.uiCanvas       = root.querySelector('.playerCanvas');
  this.uiSubtitlesBox = root.querySelector('.playerSubtitlesBox');

  // subtitles player
  this.updateSubtitles = function(){};

  // WebChimera player & renderer
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
    this.updateSubtitles(time/1000);
    this.emit('timeChanged', time);
  }).bind(this);

  // resize canvas on window resize
  require('../app_modules/throttleevent')('resize', 'optimizedResize', window);
  window.addEventListener('optimizedResize',(function(){
    this.resize();
  }).bind(this));
}
util.inherits(Player, EventEmitter);

module.exports = Player;

// resize video canvas to fit available space
// see node_modules_hacked/wcjs-renderer/index.js:191
Player.prototype.resize = function () {
  this.uiCanvas.dispatchEvent(new this.Event('webglcontextrestored'));
}

// play mrl, resumes playing if no mrl given
Player.prototype.play = function (mrl) {
  if(mrl) {
    if(!mrl.startsWith('http://') && !mrl.startsWith('file://')) mrl='file://'+mrl;
    this.vlc.play(mrl);
  }  else {
    this.vlc.play();
  }
}
Player.prototype.pause = function () {
  this.vlc.pause();
}
// return true if playing after call, false otherwise
Player.prototype.togglePause = function () {
  this.vlc.togglePause();
  return this.vlc.playing;
}
Player.prototype.stop = function () {
  this.vlc.stop();
}
// return length in ms
Player.prototype.length = function () {
  return this.vlc.length;
}
// time in ms
// return new time value
Player.prototype.time = function (time) {
  if(typeof time != 'undefined') this.vlc.time = +time;
  return this.vlc.time;
}
Player.prototype.seek = function (time) {
  if(typeof time != 'undefined') this.vlc.time = +time;
  return this.vlc.time;
}
// delta in ms, positive or negative
// return new time value
Player.prototype.jump = function (delta) {
  this.vlc.time = this.vlc.time + delta;
  return this.vlc.time;
}
// position in [0,1]
// return new position
Player.prototype.position = function (p) {
  if(typeof p != 'undefined') this.vlc.position = p;
  return this.vlc.position;
}
// normal volume is in [0;100]
// values beyond 100 are possible but expect bad quality
// return new volume value
Player.prototype.volume = function (vol) {
  if(typeof vol != 'undefined') this.vlc.volume = +vol;
  return this.vlc.volume;
}
// return true if muted after call, false otherwise
Player.prototype.mute = function (mute) {
  if(typeof mute != 'undefined') this.vlc.mute = mute;
  return this.vlc.mute;
}
// return true if muted after call, false otherwise
Player.prototype.toggleMute = function () {
  this.vlc.toggleMute();
  return this.vlc.mute;
}
// return new active audio index
// set -1 to disable audio
Player.prototype.audio = function (track) {
  if(Number.isInteger(track)) this.vlc.audio.track = +track;
  return this.vlc.audio.track;
}
// pass a number to set built-in track
// or a uri to load from file
// return new active subtitles index
// set -1 to disable subtitles (built-in and external)
Player.prototype.subtitles = function (s) {
  if(Number.isInteger(s)) {
    this.vlc.subtitles.track = s;
    if(s == -1) {
      this.stopExternalSubtitle();
    }
  } else if(s) {
    this.setSubtitlesFile(s);
  }
  return this.vlc.subtitles.track;
}

// try to detect encoding if omitted
Player.prototype.setSubtitlesFile = function (uri, encoding) {
  if (uri.startsWith('http://')) {
    var dir  = '/tmp/arnold/srt';
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
        var text = buffer.toString();
      }
      this.updateSubtitles = require('subplay')(text, (function(text) {
        this.writeSubtitle(text);
      }).bind(this));
    }).bind(this));
  }
}
Player.prototype.writeSubtitle = function (text) {
  this.uiSubtitlesBox.innerHTML = text;
}
Player.prototype.stopExternalSubtitle = function () {
  this.updateSubtitles(-1);
  this.updateSubtitles = function(){};
  this.writeSubtitle('');
}

/**
 * @return { WebChimera.VlcAudio }
 *           .count returns the number of tracks
 *           [i] returns the ith track
 */
Player.prototype.getAudio = function () {
  return this.vlc.audio;
}
Player.prototype.getAudioTrack = function () {
  return this.vlc.audio.track;
}

/**
 * @return { WebChimera.VlcSubtitles }
 *           .count returns the number of tracks
 *           [i] returns the ith track
 */
Player.prototype.getSubtitles = function () {
  return this.vlc.subtitles;
}
Player.prototype.getSubtitlesTrack = function () {
  return this.vlc.subtitles.track;
}

/**
 * @return { WebChimera.VlcMedia }
 */
Player.prototype.getPlaylistItem = function () {
  return this.vlc.playlist.items[this.vlc.playlist.currentItem];
}
