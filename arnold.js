/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * arnold.js - Main Application
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * App
 */
function Arnold() {

  onResize();

  this.initPlayer();
  this.initHotKeys();

  var popcorn = new Popcorn();
  popcorn.loadResults();

  var argv = require('nw.gui').App.argv;
  if(argv && argv.length > 0) {
    playUri(argv[0]);
  }
}

Arnold.prototype.initHotKeys = function() {

  window.addEventListener('keypress', function(e) {
    if (e.keyCode == 32) {  // space
      player.vlc.togglePause();
    }
  })
  canvas.addEventListener('click', function() {
    player.vlc.togglePause();
  })
}

Arnold.prototype.initPlayer = function() {

  this.player = new Player(canvas);
  this.player.vlc.onPlaying = (function() {
    document.querySelector('#canvas_wrapper').className = 'playing';
    mediaInfo.mrl = this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].mrl;
    mediaInfo.title=this.player.vlc.playlist.items[this.player.vlc.playlist.currentItem].title;
    mediaInfo.audio=this.player.vlc.audio;
    mediaInfo.subtitles=this.player.vlc.subtitles;
    updateMediaInfo();
    subtitles.getOpenSubtitlesHash();
    selectAudio.value = this.player.vlc.audio.track;
    selectSubtitles.value = this.player.vlc.subtitles.track;

    // var i = player.vlc.playlist.add('/Users/alexandrebintz/Downloads/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt');
    // console.log(player.vlc.playlist.playItem(i));
  }).bind(this);
  this.player.vlc.onTimeChanged = function(time) {
    subtitles.updateSubtitles(time/1000);
  }
  this.player.vlc.onStopped = function() {
    document.querySelector('#canvas_wrapper').className = '';
    reload();
  }
}

Arnold.prototype.playUri = function(uri) {

  log('opening media');
  this.player.playUri(uri);
  hideControls();
  showClose();
}
