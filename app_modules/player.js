/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * player.js - Wrapper for WebChimera renderer
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

var util = require('util');
var EventEmitter = require('events');

/**
 * Player
 * inherits EventEmitter
 *
 * @param canvas { HTMLCanvasElement } - canvas to use to render frames
 */
function Player(canvas) {
  EventEmitter.call(this);

  // init WebChimera renderer

  var wcjs = require("./node_modules_hacked/wcjs-renderer");
  this.vlc = wcjs.init(canvas);

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
}
util.inherits(Player, EventEmitter);

/**
 * Player - toggle Play/Pause
 */
Player.prototype.togglePause = function () {

  this.vlc.togglePause();
}

/**
 * Player - stop
 */
Player.prototype.stop = function () {

  this.vlc.stop();
}

/**
 * Player - jump
 *
 * @param delta { number } - jump delta in ms (can be negative for backward jump)
 */
Player.prototype.jump = function (delta) {

  this.vlc.time = this.vlc.time + delta;
}

/**
 * Player - set active audio track
 *
 * @param track { number }
 */
Player.prototype.setAudioTrack = function (track) {

  this.vlc.audio.track = track;
}

/**
 * Player - set active subtitles track
 *
 * @param track { number }
 */
Player.prototype.setSubtitlesTrack = function (track) {

  this.vlc.subtitles.track = track;
}

/**
 * Player - return current item in the playlist
 *
 * @return { WebChimera.VlcMedia }
 */
Player.prototype.getCurrentPlaylistItem = function () {

  var index = this.vlc.playlist.currentItem;
  return this.vlc.playlist.items[index];
}

/**
 * Player - return current audio properties
 *
 * @return { WebChimera.VlcAudio }
 */
Player.prototype.getAudio = function () {

  return this.vlc.audio;
}

/**
 * Player - return current audio track number
 *
 * @return { number }
 */
Player.prototype.getCurrentAudioTrack = function () {

  return this.getAudio().track;
}

/**
 * Player - return current subtitles properties
 *
 * @return { WebChimera.VlcSubtitles }
 */
Player.prototype.getSubtitles = function () {

  return this.vlc.subtitles;
}

/**
 * Player - return current subtitles track number
 *
 * @return { number }
 */
Player.prototype.getCurrentSubtitlesTrack = function () {

  return this.getSubtitles().track;
}

/**
 * Player - play given URI
 *
 * @param uri { string } - URI to play, can be :
 *                         • any kind of path or URL to any file that VLC would play
 *                           e.g. /User/john/file.mkv
 *                                http://example.com/file.avi
 *                         • local path to a .torrent file,
 *                           e.g. /User/john/file.torrent
 *                         • magnet link
 *                           e.g. magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
 */
Player.prototype.playUri = function(uri) {

  if (this.isMagnet(uri) || this.isTorrent(uri)) {
    this.playTorrent(uri);

  } else {
    this.playFile(uri);
  }
}

/**
 * Player - play magnet link or torrent file
 *
 * @param source { string } - magnet link
 *                            • e.g. magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
 *                          - local path to a .torrent file
 *                            • e.g. /User/john/file.torrent
 */
Player.prototype.playTorrent = function(source) {

  require('./app_modules/torrent').createStreamFromTorrent(source, (function(err, stream) {
    if(err) return;
    this.playUri(stream.url);
    app.mediaInfo.filepath = stream.filepath;
  }).bind(this));
}

/**
 * Player - play media file
 *
 * @param uri { string } - any kind of path or URL to any file that VLC would play
 *                         e.g. /User/john/file.mkv
 *                              http://example.com/file.avi
 */
Player.prototype.playFile = function(uri) {

  if (this.isHTTP(uri)) {
    this.playMRL(uri);

  } else {
    this.playMRL(uri.startsWith('file://') ? uri : 'file://'+uri);
  }
}

/**
 * Player - play MRL
 *
 * @param mrl { string } - MRL that VLC can play
 */
Player.prototype.playMRL = function(mrl) {

  this.vlc.play(mrl);
}

/**
 * Player - test if URI is HTTP URL
 *
 * @param uri { string } - URI to test
 */
Player.prototype.isHTTP = function(uri) {

  return new RegExp('^http://').test(uri);
}

/**
 * Player - test if URI is magnet link
 *
 * @param uri { string } - URI to test
 */
Player.prototype.isMagnet = function(uri) {

  return new RegExp('^magnet').test(uri);
}

/**
 * Player - test if URI is .torrent file
 *
 * @param uri { string } - URI to test
 */
Player.prototype.isTorrent = function(uri) {

  return new RegExp('\.torrent$').test(uri)
}
