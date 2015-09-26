/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * player.js - Wrapper for WebChimera renderer
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

const util = require('util');
const EventEmitter = require('events');

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

  if (this.isMagnet(uri)) {
    this.playMagnet(uri);

  } else if (this.isTorrent(uri)) {
    this.playTorrent(uri);

  } else {
    this.playFile(uri);
  }
}

/**
 * Player - play magnet link
 *
 * @param magnet { string } - magnet link
 *                            e.g. magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
 */
Player.prototype.playMagnet = function(magnet) {

  app.gui.log('opening magnet');
  Torrent.playFromTorrentOrMagnet(magnet);
}

/**
 * Player - play from torrent file
 *
 * @param path { string } - local path to a .torrent file,
 *                          e.g. /User/john/file.torrent
 */
Player.prototype.playTorrent = function(path) {

  Torrent.playFromFile(path);
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

    app.gui.log('playing url');
    this.playMRL(uri);

  } else {

    app.gui.log('playing local media file');
    this.playMRL(uri.startsWith('file://') ? uri : 'file://'+uri);
  }
}

/**
 * Player - play MRL
 *
 * @param mrl { string } - mrl that VLC can play
 */
Player.prototype.playMRL = function(mrl) {

  this.vlc.play(mrl);
}

/**
 * Player - test if URI is HTTP URL
 *
 * @param uri { string } - uri to test
 */
Player.prototype.isHTTP = function(uri) {

  return new RegExp('http://').test(uri);
}

/**
 * Player - test if URI is magnet link
 *
 * @param uri { string } - uri to test
 */
Player.prototype.isMagnet = function(uri) {

  return new RegExp('^magnet').test(uri);
}

/**
 * Player - test if URI is .torrent file
 *
 * @param uri { string } - uri to test
 */
Player.prototype.isTorrent = function(uri) {

  return new RegExp('\.torrent$').test(uri)
}
