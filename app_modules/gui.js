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
 * ArnoldGui
 */
function Gui() {

  this.createAppMenuBar();

  this.initInputs();
  this.initDragNDrop();

  window.addEventListener('resize', (function() {
    this.onResize();
  }).bind(this));

  uiMenuHome.addEventListener('click', (function() {
    this.showScreen('home');
  }).bind(this));
  uiMenuPlaying.addEventListener('click', (function() {
    this.showScreen('playing');
  }).bind(this));
  uiMenuPopcorn.addEventListener('click', (function() {
    this.showScreen('popcorn');
  }).bind(this));

  this.showScreen('home');
}

Gui.prototype.showScreen = function (screen) {

  uiMenuHome.className    = screen == 'home'    ? 'active' : 'inactive';
  uiMenuPlaying.className = screen == 'playing' ? 'active' : 'inactive';
  uiMenuPopcorn.className = screen == 'popcorn' ? 'active' : 'inactive';

  home.style.display    = screen == 'home'    ? 'block' : 'none';
  playing.style.display = screen == 'playing' ? 'block' : 'none';
  popcorn.style.display = screen == 'popcorn' ? 'block' : 'none';
}

Gui.prototype.initInputs = function() {

  inputFile.addEventListener('change', (function() {
    app.playUri(inputFile.value);
  }).bind(this));

  btnChooseFile.addEventListener('click', (function() {
    this.showOpenFileDialog();
  }).bind(this));

  btnUriOpen.addEventListener('click', (function() {
    app.playUri(inputUri.value);
  }).bind(this));

  btnUriPaste.addEventListener('click', (function() {
    app.playUri(this.getClipboardContent());
  }).bind(this));
}

Gui.prototype.showOpenFileDialog = function () {

  inputFile.click();
}

Gui.prototype.initDragNDrop = function() {

  var holder = document.querySelector('#home');
  holder.ondragover = function (e) {
    this.className = 'hover';
    var filepath = e.dataTransfer.files[0] && e.dataTransfer.files[0].path;
    var url = e.dataTransfer.getData('URL');
    var hint1 = "";
    var hint2 = "";
    if (filepath) {
      hint1 = filepath;
      if(/\.torrent$/.test(filepath)) {
        hint2 = "torrent file";
      } else {
        hint2 = "media file";
      }
    }
    document.querySelector('#dropHint1').innerHTML = hint1;
    document.querySelector('#dropHint2').innerHTML = hint2;
    return false;
  };
  holder.ondragleave = function () { this.className = ''; return false; };
  holder.ondrop = function (e) {
    e.preventDefault();
    var filepath = e.dataTransfer.files[0] && e.dataTransfer.files[0].path;
    if (filepath) {
      app.playUri(filepath);
      return false;
    }
    return false;
  };
}

/**
 * Gui - update display with new media info
 *
 * @param mediaInfo { MediaInfo }
 */
Gui.prototype.updateMediaInfo = function(mediaInfo) {

  document.querySelector('#mediaTitle').innerHTML=mediaInfo.title;
  document.querySelector('#mediaIMDBID').innerHTML=mediaInfo.imdb_id;
  document.querySelector('#mediaHash').innerHTML=mediaInfo.os_hash;
  var selectAudio = document.querySelector('#selectAudio');
  while (selectAudio.firstChild) {
    selectAudio.removeChild(selectAudio.firstChild);
  }
  for (var i = 0; i < mediaInfo.audio.count; i++) {
    var option = document.createElement('option');
    option.value=i;
    option.text=mediaInfo.audio[i];
    selectAudio.add(option);
  }
  selectAudio.addEventListener('change', function () {
    app.player.vlc.audio.track = +selectAudio.value;
  })
  var selectSubtitles = document.querySelector('#selectSubtitles');
  while (selectSubtitles.firstChild) {
    selectSubtitles.removeChild(selectSubtitles.firstChild);
  }
  for (var i = 0; i < mediaInfo.subtitles.count; i++) {
    var option = document.createElement('option');
    option.value=i;
    option.text=mediaInfo.subtitles[i];
    selectSubtitles.add(option);
  }
  selectSubtitles.addEventListener('change', function () {
    app.player.vlc.subtitles.track = +selectSubtitles.value;
  })
}

Gui.prototype.onResize = function() {
}

Gui.prototype.hideControls = function() {

  document.querySelector('#home').style.visibility='hidden';
  document.querySelector('#home').style.display='none';
}

Gui.prototype.showClose = function () {
}

Gui.prototype.createAppMenuBar = function() {

  var nwgui = require('nw.gui');
  var menubar = undefined;

  function initMenuBar() {

    menubar = new nwgui.Menu({ type: 'menubar' });
    nwgui.Window.get().menu = menubar;

    menubar.createMacBuiltin('Arnold',{
      hideEdit: false,
      hideWindow: false
    });
  }

  function item(label, action, key, modifiers) {

    return new nwgui.MenuItem({
      label     : label,
      click     : action,
      key       : key,
      modifiers : modifiers,
    });
  }

  function separator() {

    return new nwgui.MenuItem({ type: 'separator' });
  }

  function menu(label, items) {

    var menu = new nwgui.Menu();

    for (var i=0 ; i<items.length ; i++) {
      menu.append(items[i]);
    }

    var item = new nwgui.MenuItem({
      label   : label,
      submenu : menu,
    });

    menubar.append(item);
  }

  initMenuBar();

  menu('View', [

    item('Fullscreen', function () {
      nwgui.Window.get().toggleFullscreen();
    }),

    item('Kiosk', function () {
      nwgui.Window.get().toggleKioskMode();
    }),

    separator(),

    item('Open dev tools', function () {
      nwgui.Window.get().showDevTools();
    }),

    item('Reload', function () {
      app.reload();
    }),
  ]);

  menu('Play', [

    item('Play/Pause', function () {
      app.player.vlc.togglePause();
    }),

    item('Stop', function () {
      app.player.vlc.stop();
    }),

    separator(),

    item('Jump forward 1s', function () {
      app.player.vlc.time = app.player.vlc.time + 1000*1;
    },
      String.fromCharCode(29), // arrow right
      'shift'
    ),

    item('Jump forward 10s', function () {
      app.player.vlc.time = app.player.vlc.time + 1000*10;
    },
      String.fromCharCode(29), // arrow right
      'alt'
    ),

    item('Jump forward 1min', function () {
      app.player.vlc.time = app.player.vlc.time + 1000*60;
    },
      String.fromCharCode(29), // arrow right
      'cmd'
    ),

    item('Jump backward 1s', function () {
      app.player.vlc.time = app.player.vlc.time - 1000*1;
    },
      String.fromCharCode(28), // arrow left
      'shift'
    ),

    item('Jump backward 10s', function () {
      app.player.vlc.time = app.player.vlc.time - 1000*10;
    },
      String.fromCharCode(28), // arrow left
      'alt'
    ),

    item('Jump backward 1min', function () {
      app.player.vlc.time = app.player.vlc.time - 1000*60;
    },
      String.fromCharCode(28), // arrow left
      'cmd'
    ),
  ]);
}

Gui.prototype.log = function(text) {

  document.querySelector('#log').innerHTML += '<p> • '+text+'</p>';
}

Gui.prototype.getClipboardContent = function() {

  return require('nw.gui').Clipboard.get().get('text');
}

Gui.prototype.setPlaying = function (playing) {

  document.querySelector('#player').className = playing ? 'playing' : '';
}

/**
 * Gui - update display for current audio track
 *
 * @param track { number }
 */
Gui.prototype.setCurrentAudioTrack = function (track) {

  selectAudio.value = track;
}

/**
 * Gui - update display for current subtitles track
 *
 * @param track { number }
 */
Gui.prototype.setCurrentSubtitlesTrack = function (track) {

  selectSubtitles.value = track;
}
