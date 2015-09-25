



// =============================================================================
// global DOM elements

var canvas = document.getElementById("canvas");

// =============================================================================
// player

var player = null;
function createPlayer() {
  player = new Player(canvas);
  player.vlc.onPlaying = function() {
    document.querySelector('#canvas_wrapper').className = 'playing';
    mediaInfo.mrl = player.vlc.playlist.items[player.vlc.playlist.currentItem].mrl;
    mediaInfo.title=player.vlc.playlist.items[player.vlc.playlist.currentItem].title;
    mediaInfo.audio=player.vlc.audio;
    mediaInfo.subtitles=player.vlc.subtitles;
    updateMediaInfo();
    subtitles.getOpenSubtitlesHash();
    selectAudio.value = player.vlc.audio.track;
    selectSubtitles.value = player.vlc.subtitles.track;

    // var i = player.vlc.playlist.add('/Users/alexandrebintz/Downloads/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt');
    // console.log(player.vlc.playlist.playItem(i));

    console.log(player);
  }
  player.vlc.onTimeChanged = function(time) {
    subtitles.updateSubtitles(time/1000);
  }
  player.vlc.onStopped = function() {
    document.querySelector('#canvas_wrapper').className = '';
    reload();
  }
  return player;
}

function playUri(uri) {
  log('opening media');
  player.playUri(uri);
  hideControls();
  showClose();
}

// =============================================================================
// Display
//

window.addEventListener('resize', function() {
  onResize();
})

function onResize() {
  var topspacer = document.querySelector('#topspacer');
  topspacer.style.height=window.innerHeight+'px';
  // var margin = 0;
  // canvas.width = window.innerWidth-2*margin;
  // canvas.height = window.innerHeight-2*margin;
}
function hideControls() {
  document.querySelector('#controls').style.visibility='hidden';
  document.querySelector('#controls').style.display='none';
}
function showClose() {
  // document.querySelector('#closeButton').style.visibility='visible';
}
function reload() {
  require('nw.gui').Window.get().reloadDev();
}
document.querySelector('#closeButton').addEventListener('click', reload);
function log(text) {
  document.querySelector('#log').innerHTML += '<p> • '+text+'</p>';
}



Menu.createAppMenuBar();


// =============================================================================
// Media info

var mediaInfo = {};
function updateMediaInfo() {
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
    player.vlc.audio.track = +selectAudio.value;
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
    player.vlc.subtitles.track = +selectSubtitles.value;
  })
}

// =============================================================================
// Subtitles

var subtitles = new Subtitles();



// =============================================================================
// Drag & Drop

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
    playUri(filepath);
    return false;
  }
  return false;
};

// =============================================================================
// User input

var inputFile = document.querySelector('#inputFile');
var inputUri = document.querySelector('#inputUri');
var inputUriOpen = document.querySelector('#inputUriOpen');
var inputUriPaste = document.querySelector('#inputUriPaste');

function initInputs() {
  inputFile.addEventListener("change", function(evt) {
    playUri(this.value);
  }, false);
  inputUriOpen.addEventListener("click", function(evt) {
    playUri(inputUri.value);
  }, false);
  inputUriPaste.addEventListener("click", function(evt) {
    playUri(getClipboardContent());
  }, false);
}
function chooseFile() {
  inputFile.click();
}
initInputs();

document.querySelector('#chooseFile').addEventListener('click', function() {
  chooseFile();
})

// =============================================================================
// System clipboard
//

function getClipboardContent() {
  var gui = require('nw.gui');
  var clipboard = gui.Clipboard.get();
  var text = clipboard.get('text');
  return text;
}

// =============================================================================
// Keyboard hotkeys and general ui commands
//

window.addEventListener('keypress', function(e) {
  if (e.keyCode == 32) {  // space
    player.vlc.togglePause();
  }
})
canvas.addEventListener('click', function() {
  player.vlc.togglePause();
})

// =============================================================================
// Open file from argv
//

var argv = require('nw.gui').App.argv;
if(argv && argv.length > 0) {
  playUri(argv[0]);
}

// =============================================================================
// Popcorn API
//

var popcorn = new Popcorn();
popcorn.loadResults();

// =============================================================================
// Main
//

onResize();
createPlayer();





// =============================================================================
// =============================================================================
// dev
//
// require('nw.gui').Window.get().showDevTools();
// playLocalMediaFile('/Users/alexandrebintz/Movies/family_matters_1x22_rock_video.avi');
// playUri('/Users/alexandrebintz/Movies/another_earth_2011_1080p_it_eng_es_fr_sub_it_eng_es_fr_de_da_ne_nor_su.mkv');
// var path = '/Users/alexandrebintz/Movies/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt';
// loadSubtitles(path);
