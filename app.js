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

    this.mediaInfo.mrl = this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].mrl;
    this.mediaInfo.title=this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].title;

    this.mediaInfo.audio=this.player.vlc.audio;
    this.mediaInfo.subtitles=this.player.vlc.subtitles;

    this.gui.updateMediaInfo();

    this.subtitles.getOpenSubtitlesHash();

    selectAudio.value = this.player.vlc.audio.track;
    selectSubtitles.value = this.player.vlc.subtitles.track;

  }).bind(this));

  this.player.on('timeChanged', (function(time) {

    this.subtitles.updateSubtitles(time/1000);

  }).bind(this));

  this.player.on('stopped', (function() {

    this.gui.setPlaying(false);
    this.reload();

  }).bind(this));
}

App.prototype.initSubtitles = function () {

  this.subtitles = new Subtitles();
}

App.prototype.initPopcorn = function () {

  this.popcorn = new Popcorn();
}

App.prototype.initGui = function () {

  this.gui = new Gui();
  this.gui.onResize();
}

App.prototype.initHotKeys = function() {

  window.addEventListener('keypress', (function(e) {
    if (e.keyCode == 32) {  // space
      this.player.vlc.togglePause();
    }
  }).bind(this));

  document.querySelector('#canvas').addEventListener('click', (function() {
    this.player.vlc.togglePause();
  }).bind(this));
}

/**
 * App - start application
 */
App.prototype.start = function () {

  this.openFromArgv();

  this.popcorn.loadResults();
}

App.prototype.openFromArgv = function () {

  var argv = require('nw.gui').App.argv;
  if(argv && argv.length > 0) {
    this.playUri(argv[0]);
  }
}

App.prototype.playUri = function(uri) {

  this.gui.log('opening media');
  this.player.playUri(uri);
  this.gui.hideControls();
  this.gui.showClose();
}

App.prototype.reload = function () {

  require('nw.gui').Window.get().reloadDev();
}
