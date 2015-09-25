/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * arnoldgui.js - Main Application's GUI manager
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * ArnoldGui
 */
function ArnoldGui() {

  this.createAppMenuBar();

  this.initInputs();
  this.initDragNDrop();

  window.addEventListener('resize', (function() {
    this.onResize();
  }).bind(this));

  document.querySelector('#closeButton').addEventListener('click', this.reload);
}

ArnoldGui.prototype.initInputs = function() {

  var inputFile = document.querySelector('#inputFile');
  var inputUri = document.querySelector('#inputUri');
  var inputUriOpen = document.querySelector('#inputUriOpen');
  var inputUriPaste = document.querySelector('#inputUriPaste');

  function initInputs() {
    inputFile.addEventListener("change", function(evt) {
      arnold.playUri(this.value);
    }, false);
    inputUriOpen.addEventListener("click", function(evt) {
      arnold.playUri(inputUri.value);
    }, false);
    inputUriPaste.addEventListener("click", (function(evt) {
      arnold.playUri(this.getClipboardContent());
    }).bind(this), false);
  }
  function chooseFile() {
    inputFile.click();
  }
  initInputs();

  document.querySelector('#chooseFile').addEventListener('click', function() {
    chooseFile();
  })
}

ArnoldGui.prototype.initDragNDrop = function() {

  var holder = document.querySelector('#controls');
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
      arnold.playUri(filepath);
      return false;
    }
    return false;
  };
}

ArnoldGui.prototype.updateMediaInfo = function() {

  document.querySelector('#mediaTitle').innerHTML=arnold.mediaInfo.title;
  document.querySelector('#mediaIMDBID').innerHTML=arnold.mediaInfo.imdb_id;
  document.querySelector('#mediaHash').innerHTML=arnold.mediaInfo.os_hash;
  var selectAudio = document.querySelector('#selectAudio');
  while (selectAudio.firstChild) {
    selectAudio.removeChild(selectAudio.firstChild);
  }
  for (var i = 0; i < arnold.mediaInfo.audio.count; i++) {
    var option = document.createElement('option');
    option.value=i;
    option.text=arnold.mediaInfo.audio[i];
    selectAudio.add(option);
  }
  selectAudio.addEventListener('change', function () {
    player.vlc.audio.track = +selectAudio.value;
  })
  var selectSubtitles = document.querySelector('#selectSubtitles');
  while (selectSubtitles.firstChild) {
    selectSubtitles.removeChild(selectSubtitles.firstChild);
  }
  for (var i = 0; i < arnold.mediaInfo.subtitles.count; i++) {
    var option = document.createElement('option');
    option.value=i;
    option.text=arnold.mediaInfo.subtitles[i];
    selectSubtitles.add(option);
  }
  selectSubtitles.addEventListener('change', function () {
    player.vlc.subtitles.track = +selectSubtitles.value;
  })
}

ArnoldGui.prototype.onResize = function() {

  var topspacer = document.querySelector('#topspacer');
  topspacer.style.height=window.innerHeight+'px';
  // var margin = 0;
  // canvas.width = window.innerWidth-2*margin;
  // canvas.height = window.innerHeight-2*margin;
}

ArnoldGui.prototype.hideControls = function() {

  document.querySelector('#controls').style.visibility='hidden';
  document.querySelector('#controls').style.display='none';
}

ArnoldGui.prototype.showClose = function () {

  // document.querySelector('#closeButton').style.visibility='visible';
}

ArnoldGui.prototype.createAppMenuBar = function() {

  var gui = require('nw.gui');
  var menubar = undefined;

  function initMenuBar() {

    menubar = new gui.Menu({ type: 'menubar' });
    gui.Window.get().menu = menubar;

    menubar.createMacBuiltin('Arnold',{
      hideEdit: false,
      hideWindow: false
    });
  }

  function item(label, action, key, modifiers) {

    return new gui.MenuItem({
      label     : label,
      click     : action,
      key       : key,
      modifiers : modifiers,
    });
  }

  function separator() {

    return new gui.MenuItem({ type: 'separator' });
  }

  function menu(label, items) {

    var menu = new gui.Menu();

    for (var i=0 ; i<items.length ; i++) {
      menu.append(items[i]);
    }

    var item = new gui.MenuItem({
      label   : label,
      submenu : menu,
    });

    menubar.append(item);
  }

  initMenuBar();

  menu('View', [

    item('Fullscreen', function () {
      gui.Window.get().toggleFullscreen();
    }),

    item('Kiosk', function () {
      gui.Window.get().toggleKioskMode();
    }),

    separator(),

    item('Open dev tools', function () {
      gui.Window.get().showDevTools();
    }),

    item('Reload', function () {
      arnold.reload();
    }),
  ]);

  menu('Play', [

    item('Play/Pause', function () {
      player.vlc.togglePause();
    }),

    item('Stop', function () {
      player.vlc.stop();
    }),

    separator(),

    item('Jump forward 1s', function () {
      player.vlc.time = player.vlc.time + 1000*1;
    },
      String.fromCharCode(29), // arrow right
      'shift'
    ),

    item('Jump forward 10s', function () {
      player.vlc.time = player.vlc.time + 1000*10;
    },
      String.fromCharCode(29), // arrow right
      'alt'
    ),

    item('Jump forward 1min', function () {
      player.vlc.time = player.vlc.time + 1000*60;
    },
      String.fromCharCode(29), // arrow right
      'cmd'
    ),

    item('Jump backward 1s', function () {
      player.vlc.time = player.vlc.time - 1000*1;
    },
      String.fromCharCode(28), // arrow left
      'shift'
    ),

    item('Jump backward 10s', function () {
      player.vlc.time = player.vlc.time - 1000*10;
    },
      String.fromCharCode(28), // arrow left
      'alt'
    ),

    item('Jump backward 1min', function () {
      player.vlc.time = player.vlc.time - 1000*60;
    },
      String.fromCharCode(28), // arrow left
      'cmd'
    ),
  ]);
}

ArnoldGui.prototype.log = function(text) {

  document.querySelector('#log').innerHTML += '<p> • '+text+'</p>';
}

ArnoldGui.prototype.getClipboardContent = function() {

  return require('nw.gui').Clipboard.get().get('text');
}
