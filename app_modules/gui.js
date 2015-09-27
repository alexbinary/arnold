/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * gui.js - Main Application's GUI manager
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * Gui
 *
 * Setup and configure GUI components
 */
function Gui() {

  // these should be set by class user
  this.cmd               = function() {};
  this.identifyMediaType = function() {};

  this.createAppMenuBar();

  this.initWindow();
  this.initUiMenu();

  this.initScreenHome();
  this.initScreenPlaying();
}

/**
 * Gui - Create application native menu bar
 */
Gui.prototype.createAppMenuBar = function() {

  var mb = new MenuBuilder();

  mb.initMenuBar();
  mb.createMacBuiltin();

  mb.menu('View', [

    mb.item('Toggle UI', (function () {
      this.toggleUI();
    }).bind(this),
      'I',
      'cmd'
    ),

    mb.separator(),

    mb.item('Fullscreen', function () {
      require('nw.gui').Window.get().toggleFullscreen();
    }),

    mb.item('Kiosk', function () {
      require('nw.gui').Window.get().toggleKioskMode();
    }),

    mb.separator(),

    mb.item('Open dev tools', function () {
      require('nw.gui').Window.get().showDevTools();
    }),

    mb.item('Reload', function () {
      require('nw.gui').Window.get().reloadDev();
    }),
  ]);

  mb.menu('Play', [

    mb.item('Play/Pause', (function () {
      this.cmd('togglePause');
    }).bind(this)),

    mb.item('Stop', (function () {
      this.cmd('stop');
    }).bind(this)),

    mb.separator(),

    mb.item('Jump forward 1s', (function () {
      this.cmd('jump', +1000*1);
    }).bind(this),
      String.fromCharCode(29), // arrow right
      'shift'
    ),

    mb.item('Jump forward 10s', (function () {
      this.cmd('jump', +1000*10);
    }).bind(this),
      String.fromCharCode(29), // arrow right
      'alt'
    ),

    mb.item('Jump forward 1min', (function () {
      this.cmd('jump', +1000*60);
    }).bind(this),
      String.fromCharCode(29), // arrow right
      'cmd'
    ),

    mb.item('Jump backward 1s', (function () {
      this.cmd('jump', -1000*1);
    }).bind(this),
      String.fromCharCode(28), // arrow left
      'shift'
    ),

    mb.item('Jump backward 10s', (function () {
      this.cmd('jump', -1000*10);
    }).bind(this),
      String.fromCharCode(28), // arrow left
      'alt'
    ),

    mb.item('Jump backward 1min', (function () {
      this.cmd('jump', -1000*60);
    }).bind(this),
      String.fromCharCode(28), // arrow left
      'cmd'
    ),
  ]);
}

/**
 * Gui - Configure window object
 */
Gui.prototype.initWindow = function () {

  window.addEventListener('resize', (function() {
    this.onResize();
  }).bind(this));
}

/**
 * Gui - adapt to window size change
 */
Gui.prototype.onResize = function() {
}

/**
 * Gui - Setup and configure in app main menu
 */
Gui.prototype.initUiMenu = function () {

  uiMenuHome.addEventListener('click', (function() {
    this.showScreen('home');
  }).bind(this));
  uiMenuPlaying.addEventListener('click', (function() {
    this.showScreen('playing');
  }).bind(this));
  uiMenuPopcorn.addEventListener('click', (function() {
    this.showScreen('popcorn');
  }).bind(this));
}

/**
 * Gui - Init UI screen "home"
 */
Gui.prototype.initScreenHome = function () {

  this.screenHome = new ScreenHome();

  this.screenHome.showOpenFileDialog  = this.showOpenFileDialog;
  this.screenHome.getClipboardContent = this.getClipboardContent;

  // these can be changed anytime, so we need a wrapper

  this.screenHome.cmd = (function() {
    this.cmd.apply(this, arguments);
  }).bind(this);

  this.screenHome.identifyMediaType = (function() {
    this.identifyMediaType.apply(this, arguments);
  }).bind(this);
}

/**
 * Gui - Init UI screen "playing"
 */
Gui.prototype.initScreenPlaying = function () {

  this.screenPlaying = new ScreenPlaying();

  // these can be changed anytime, so we need a wrapper

  this.screenPlaying.cmd = (function() {
    this.cmd.apply(this, arguments);
  }).bind(this);
}

/**
 * Gui - Configure UI in its initial state
 */
Gui.prototype.start = function () {

  this.showScreen('home');
  this.showUI();
}

/**
 * Gui - make a ui screen active
 *
 * @param screen { string } - • "home"    - controls for opening a file
 *                            • "playing" - info & controls for currently playing media
 *                            • "popcorn" - Popcorn Time API
 */
Gui.prototype.showScreen = function (screen) {

  uiMenuHome.className    = screen == 'home'    ? 'active' : 'inactive';
  uiMenuPlaying.className = screen == 'playing' ? 'active' : 'inactive';
  uiMenuPopcorn.className = screen == 'popcorn' ? 'active' : 'inactive';

  home.style.display    = screen == 'home'    ? 'block' : 'none';
  playing.style.display = screen == 'playing' ? 'block' : 'none';
  popcorn.style.display = screen == 'popcorn' ? 'block' : 'none';
}

/**
 * Gui - make main UI visible
 */
Gui.prototype.showUI = function() {

  ui.style.display = 'block';
  this.uiVisible = true;
}

/**
 * Gui - make main UI invisible
 */
Gui.prototype.hideUI = function() {

  ui.style.display = 'none';
  this.uiVisible = false;
}

/**
 * Gui - make main UI in/visible
 */
Gui.prototype.toggleUI = function() {

  if(this.uiVisible) {
    this.hideUI();
  } else {
    this.showUI();
  }
}

/**
 * Gui - open "Open File" dialog
 */
Gui.prototype.showOpenFileDialog = function () {

  inputFile.click();
}

/**
 * Gui - configure UI in playing/idle mode
 *
 * @param playing { boolean }
 */
Gui.prototype.setPlaying = function (playing) {

  document.body.className = playing ? 'playing' : '';
}

/**
 * Gui - update display for current audio track
 *
 * @param track { number }
 */
Gui.prototype.setCurrentAudioTrack = function (track) {

  this.screenPlaying.setCurrentAudioTrack(track);
}

/**
 * Gui - update display for current subtitles track
 *
 * @param track { number }
 */
Gui.prototype.setCurrentSubtitlesTrack = function (track) {

  this.screenPlaying.setCurrentSubtitlesTrack(track);
}

/**
 * Gui - update display with new media info
 *
 * @param mediaInfo { MediaInfo }
 */
Gui.prototype.updateMediaInfo = function(mediaInfo) {

  this.screenPlaying.updateMediaInfo(mediaInfo);
}

/**
 * Gui - add entry to log zone
 *
 * @param text { string } - text to log
 */
Gui.prototype.log = function(text) {

  log.innerHTML += '<p> • ' + text + '</p>';
}

/**
 * Gui - return text content from system clipboard
 *
 * @return { string }
 */
Gui.prototype.getClipboardContent = function() {

  return require('nw.gui').Clipboard.get().get('text');
}
