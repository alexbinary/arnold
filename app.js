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
 */
function App() {

  this.canvas = document.getElementById("canvas");

  this.arnoldGui = new ArnoldGui();
  this.arnoldGui.onResize();

  this.initPlayer();
  this.initHotKeys();

  this.mediaInfo = {};

  this.subtitles = new Subtitles();

  var popcorn = new Popcorn();
  popcorn.loadResults();

  var argv = require('nw.gui').App.argv;
  if(argv && argv.length > 0) {
    playUri(argv[0]);
  }
}

App.prototype.initHotKeys = function() {

  window.addEventListener('keypress', (function(e) {
    if (e.keyCode == 32) {  // space
      this.player.vlc.togglePause();
    }
  }).bind(this));
  this.canvas.addEventListener('click', (function() {
    this.player.vlc.togglePause();
  }).bind(this));
}

App.prototype.initPlayer = function() {

  this.player = new Player(this.canvas);
  this.player.vlc.onPlaying = (function() {
    document.querySelector('#canvas_wrapper').className = 'playing';
    this.mediaInfo.mrl = this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].mrl;
    this.mediaInfo.title=this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].title;
    this.mediaInfo.audio=this.player.vlc.audio;
    this.mediaInfo.subtitles=this.player.vlc.subtitles;
    this.arnoldGui.updateMediaInfo();
    this.subtitles.getOpenSubtitlesHash();
    selectAudio.value = this.player.vlc.audio.track;
    selectSubtitles.value = this.player.vlc.subtitles.track;

    // var i = player.vlc.playlist.add('/Users/alexandrebintz/Downloads/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt');
    // console.log(player.vlc.playlist.playItem(i));
  }).bind(this);
  this.player.vlc.onTimeChanged = function(time) {
    this.subtitles.updateSubtitles(time/1000);
  }
  this.player.vlc.onStopped = (function() {
    document.querySelector('#canvas_wrapper').className = '';
    this.reload();
  }).bind(this);
}

App.prototype.playUri = function(uri) {

  this.arnoldGui.log('opening media');
  this.player.playUri(uri);
  this.arnoldGui.hideControls();
  this.arnoldGui.showClose();
}

App.prototype.reload = function () {

  require('nw.gui').Window.get().reloadDev();
}
