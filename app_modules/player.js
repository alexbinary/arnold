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

  // init subtitles engine

  this.updateSubtitles = function(){};
  this.on('timeChanged', (function(time) {
    this.updateSubtitles(time/1000);
  }).bind(this));
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
 *                      • setSubtitlesFile(path or url)
 */
Player.prototype.cmd = function (cmd) {

  var args = Array.prototype.slice.call(arguments);
  args.shift();

  if(cmd == 'play') {
    if(args[0]) { var uri = args[0];

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

    if (args[0]) { var uri = args[0];

      if (uri.startsWith('http://')) {

        var dir = '/tmp/arnold/srt';
        var name = new Date().getTime() + '.srt';
        var path = dir+'/'+name;

        new (require('download'))()
        .get(uri)
        .dest(dir)
        .rename(name)
        .run((function() {
          this.cmd('setSubtitlesFile', path);
        }).bind(this));

      } else {

        require('fs').readFile(uri, 'utf-8', (function(err, data) {
          if(err) return;
          this.updateSubtitles = (require('subplay'))(data, (function(text) {
            this.writeSubtitle(text);
          }).bind(this));
        }).bind(this));
      }

    } else {

      this.updateSubtitles(-1);
      this.updateSubtitles = function(){};
      this.writeSubtitle('');
    }
  }
}

/**
 * Write given subtitle item on screen
 */
Player.prototype.writeSubtitle = function (text) {
  this.uiSubtitlesBox.innerHTML = text;
}
