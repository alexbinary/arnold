/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * app.js - Main Application
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * App
 *
 * Init app components
 */
function App() {

  this.initMediaInfo();

  this.initPlayer();
  this.initSubtitles();

  this.initPopcorn();

  this.initGui();
  this.initHotKeys();
}

/**
 * App - init application wide MediaInfo container
 */
App.prototype.initMediaInfo = function () {

  this.mediaInfo = new MediaInfo();
}

/**
 * App - init media player
 */
App.prototype.initPlayer = function() {

  this.player = new Player(document.querySelector('#canvas'));

  this.player.on('playing', (function() {

    this.gui.setPlaying(true);

    var currentItem = this.player.getCurrentPlaylistItem();

    this.mediaInfo.mrl       = currentItem.mrl;
    this.mediaInfo.title     = currentItem.title;

    this.mediaInfo.audio     = this.player.getAudio();
    this.mediaInfo.subtitles = this.player.getSubtitles();

    this.gui.updateMediaInfo(this.mediaInfo);

    this.subtitles.getOpenSubtitlesHash();

    this.gui.setCurrentAudioTrack    (this.player.getCurrentAudioTrack());
    this.gui.setCurrentSubtitlesTrack(this.player.getCurrentSubtitlesTrack());

  }).bind(this));

  this.player.on('timeChanged', (function(time) {

    this.subtitles.updateSubtitles(time/1000);

  }).bind(this));

  this.player.on('stopped', (function() {

    this.gui.setPlaying(false);
    this.reload();

  }).bind(this));
}

/**
 * App - init subtitles engine
 */
App.prototype.initSubtitles = function () {

  this.subtitles = new Subtitles();
}

/**
 * App - init Popcorn Time API
 */
App.prototype.initPopcorn = function () {

  this.popcorn = new Popcorn();
}

/**
 * App - init display
 */
App.prototype.initGui = function () {

  this.gui = new Gui();
  this.gui.onResize();
}

/**
 * App - init keyboard shortcuts
 */
App.prototype.initHotKeys = function() {

  window.addEventListener('keypress', (function(e) {
    if (e.keyCode == 32) {  // space
      this.player.togglePause();
    }
  }).bind(this));

  document.querySelector('#canvas').addEventListener('click', (function() {
    this.player.togglePause();
  }).bind(this));
}

/**
 * App - start application
 */
App.prototype.start = function () {

  this.openFromArgv();
  this.popcorn.loadResults();
}

/**
 * App - parse command line args and play file if any
 */
App.prototype.openFromArgv = function () {

  var argv = require('nw.gui').App.argv;
  if(argv && argv.length > 0) {
    this.playUri(argv[0]);
  }
}

/**
 * App - play something
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
App.prototype.playUri = function(uri) {

  this.gui.log('opening media');

  this.player.playUri(uri);
  this.gui.hideControls();
  this.gui.showClose();
}

/**
 * App - [DEV] reload page
 */
App.prototype.reload = function () {

  require('nw.gui').Window.get().reloadDev();
}

/**
 * App - [DEV] open developer pane
 */
App.prototype.showDevTools = function () {

  require('nw.gui').Window.get().showDevTools();
}