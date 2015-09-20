
// =============================================================================
// global DOM elements

var canvas = document.getElementById("canvas");

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

// =============================================================================
// App Menu

var gui = require('nw.gui');
var menubar = new gui.Menu({ type: 'menubar' });
gui.Window.get().menu = menubar;

// standard menus

menubar.createMacBuiltin('Arnold',{
  hideEdit: false,
  hideWindow: false
});

// View Menu

var menuView = new gui.Menu();
menuView.append(new gui.MenuItem({
  label: 'Fullscreen',
  click: function () {
    gui.Window.get().toggleFullscreen();
  }
}));
menuView.append(new gui.MenuItem({
  label: 'Kiosk',
  click: function () {
    gui.Window.get().toggleKioskMode();
  }
}));
menuView.append(new gui.MenuItem({
  type: 'separator'
}));
menuView.append(new gui.MenuItem({
  label: 'Open dev tools',
  click: function () {
    gui.Window.get().showDevTools();
  }
}));
menuView.append(new gui.MenuItem({
  label: 'Reload',
  click: function () {
    reload();
  }
}));
var itemView = new gui.MenuItem({
  label: 'View',
  submenu: menuView
});
menubar.append(itemView);

// Play Menu

var menuPlay = new gui.Menu();
menuPlay.append(new gui.MenuItem({
  label: 'Play/Pause',
  click: function () {
    player.togglePause();
  }
}));
menuPlay.append(new gui.MenuItem({
  label: 'Stop',
  click: function () {
    player.stop();
  }
}));
menuPlay.append(new gui.MenuItem({
  type: 'separator'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump forward 1s',
  click: function () {
    player.time = player.time + 1000*1;
  },
  key: String.fromCharCode(29), // arrow right
  modifiers: 'shift'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump forward 10s',
  click: function () {
    player.time = player.time + 1000*10;
  },
  key: String.fromCharCode(29), // arrow right
  modifiers: 'alt'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump forward 1min',
  click: function () {
    player.time = player.time + 1000*60;
  },
  key: String.fromCharCode(29), // arrow right
  modifiers: 'cmd'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump backward 1s',
  click: function () {
    player.time = player.time - 1000*1;
  },
  key: String.fromCharCode(28), // arrow left
  modifiers: 'shift'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump backward 10s',
  click: function () {
    player.time = player.time - 1000*10;
  },
  key: String.fromCharCode(28), // arrow left
  modifiers: 'alt'
}));
menuPlay.append(new gui.MenuItem({
  label: 'Jump backward 1min',
  click: function () {
    player.time = player.time - 1000*60;
  },
  key: String.fromCharCode(28), // arrow left
  modifiers: 'cmd'
}));
var itemPlay = new gui.MenuItem({
  label: 'Play',
  submenu: menuPlay
});
menubar.append(itemPlay);


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
    player.audio.track = +selectAudio.value;
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
    player.subtitles.track = +selectSubtitles.value;
  })
}

// =============================================================================
// VLC Player

var player = null;
function createPlayer() {
  var wcjs = require("wcjs-renderer");
  player = wcjs.init(canvas);
  player.onPlaying = function() {
    document.querySelector('#canvas_wrapper').className = 'playing';
    mediaInfo.mrl = player.playlist.items[player.playlist.currentItem].mrl;
    mediaInfo.title=player.playlist.items[player.playlist.currentItem].title;
    mediaInfo.audio=player.audio;
    mediaInfo.subtitles=player.subtitles;
    updateMediaInfo();
    getOpenSubtitlesHash();
    selectAudio.value = player.audio.track;
    selectSubtitles.value = player.subtitles.track;

    // var i = player.playlist.add('/Users/alexandrebintz/Downloads/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt');
    // console.log(player.playlist.playItem(i));

    console.log(player);
  }
  player.onTimeChanged = function(time) {
    updateSubtitles(time/1000);
  }
  player.onStopped = function() {
    document.querySelector('#canvas_wrapper').className = '';
    reload();
  }
  return player;
}

// =============================================================================
// Subtitles

var updateSubtitles = function(){};
function loadSubtitles(path) {
  var srt = require('fs').readFileSync(path, 'utf-8');
  updateSubtitles = require('subplay')(srt, function(text) {
      document.querySelector('#subtitles').innerHTML = text;
  });
}
document.querySelector('#inputFileSubtitles').addEventListener('change', function(){
  loadSubtitles(this.value);
})

// =============================================================================
// OpenSubtitles

var OS = require('opensubtitles-api');
var OpenSubtitles = new OS('OSTestUserAgent');
document.querySelector('#buttonLoadSubtitles').addEventListener('click', function(){
  searchSubtitles();
})
function searchSubtitles() {
  console.log(mediaInfo.name);
  OpenSubtitles.search({
      sublanguageid: 'en',
      hash: mediaInfo.os_hash,
      // imdbid: mediaInfo.imdb_id,
      // filename: mediaInfo.title,
      // query: mediaInfo.name,
  }).then(function (subtitles) {
    var select = document.querySelector('#selectOpenSubtitles');
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
    for (var i in subtitles) {
      var option = document.createElement('option');
      option.value=subtitles[i].url;
      option.text=i;
      select.add(option);
    }
    select.addEventListener('change', function () {
      var url = select.value;
      var name = new Date().getTime() + '.srt';
      var Download = require('download');
      new Download()
          .get(url)
          .dest('/tmp')
          .rename(name)
          .run(function() {
            loadSubtitles('/tmp/'+name);
          });
    })
  });
}
function getOpenSubtitlesHash() {
  var path;
  if (new RegExp('http://').test(mediaInfo.mrl)) {
    path = mediaInfo.filepath;
  }
  else if (new RegExp('file://').test(mediaInfo.mrl)) {
    path = mediaInfo.mrl.substring(7)
  } else {
    path = mediaInfo.mrl;
  }
  console.log(path);
  OpenSubtitles.extractInfo(path)
  .then(function (infos) {
      mediaInfo.os_hash = infos.moviehash;
      updateMediaInfo();
  });
}

// =============================================================================
// Lower level torrent utilities

// @param torrent - torrent file content as buffer
//                  or magnet link
//
function playTorrentOrMagnet(magnet_link_or_buffer) {
  log('initializing download ...');
  var peerflix = require('peerflix');
  mediaInfo.filepath = '/tmp/'+(new Date().getTime());
  var engine = peerflix(magnet_link_or_buffer, { port: 0, path:mediaInfo.filepath});
  engine.server.on('listening', function () {
    log('stream is ready');
    playURL('http://localhost:'+engine.server.address().port);
  });
}

// @param path - e.g. /User/john/file.torrent
//
function playTorrentFile(path) {
  log('reading torrent file ...');
  var readTorrent = require('read-torrent');
  readTorrent(path, function (err, torrent, raw) {
    playTorrentOrMagnet(raw);
  })
}

// =============================================================================
// Low level play functions

// @param path - e.g. /User/john/file.mkv
//
function playLocalMediaFile(path) {
  log('playing local media file');
  player.play('file://'+path);
}

// @param url - e.g. http://example.com/file.mkv
//
function playRemoteMediaFile(url) {
  log('playing url');
  player.play(url);
}

// @param path - e.g. /User/john/file.torrent
//
function playLocalTorrentFile(path) {
  playTorrentFile(path);
}

// @param url - e.g. magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
//
function playMagnet(url) {
  log('opening magnet');
  playTorrentOrMagnet(url);
}

// =============================================================================
// Higer level play functions

// @param path - e.g. /User/john/file.ext
//
function playFilePath(path) {
  if(/\.torrent$/.test(path)) {
    playLocalTorrentFile(path);
  } else {
    playLocalMediaFile(path);
  }
}

// @param path - e.g. http://example.com/file.ext
//                 or magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
//
function playURL(url) {
  if(/^magnet/.test(url)) {
    playMagnet(url);
  } else {
    playRemoteMediaFile(url);
  }
}

// @param uri - e.g. /User/john/file.ext
//                or http://example.com/file.ext
//                or magnet:?xt=urn:btih:72F242DB89E763B6CE390F25D576195C2169B149&dn=big+buck+bunny+4k+uhd+hfr+60fps+flac+webdl+2160p+x264+zmachine&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce
//
function playUri(uri) {
  log('opening media');
  if(/^magnet/.test(uri) || new RegExp('http://').test(uri)) {
    playURL(uri);
  } else {
    playFilePath(uri);
  }
  hideControls();
  showClose();
}

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
    player.togglePause();
  }
})
canvas.addEventListener('click', function() {
  player.togglePause();
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

var loading = document.querySelector('#loading');
function showLoading() {
  loading.style.visibility='visible';
}
function hideLoading() {
  loading.style.visibility='hidden';
}
document.querySelector('#buttonSearch').addEventListener('click', function() {
  loadResults(document.querySelector('#inputSearch').value);
});
var request = require('request');
function loadResults(keywords) {
  showLoading();
  var url = 'http://eztvapi.re/shows/1';
  if(keywords) {
    url += '?keywords='+encodeURIComponent(keywords);
  }
  request(url, function(error, res, body) {
    var results = JSON.parse(body);
    hideLoading();
    var table = document.createElement('table');
    for(var i=0 ; i<results.length ; i++) {
      (function(result) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        var img = new Image();
        img.src = result.images['poster'];
        img.width = 50;
        td.appendChild(img);
        tr.appendChild(td);
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(result.title));
        tr.appendChild(td);
        var td = document.createElement('td');
        var btnLoad = document.createElement('button');
        btnLoad.appendChild(document.createTextNode('Load episode list'));
        td.appendChild(btnLoad);
        tr.appendChild(td);
        var td = document.createElement('td');
        var select = document.createElement('select');
        td.appendChild(select);
        tr.appendChild(td);
        var td = document.createElement('td');
        var btnPlay = document.createElement('button');
        btnPlay.appendChild(document.createTextNode('Play'));
        td.appendChild(btnPlay);
        tr.appendChild(td);
        var tdSyn = document.createElement('td');
        tr.appendChild(tdSyn);
        var episodes = [];
        btnLoad.addEventListener('click', function(){
          showLoading();
          request('http://eztvapi.re/show/'+result._id, function(error, res, body) {
            episodes = JSON.parse(body).episodes;
            hideLoading();
            for(var k=0 ; k<episodes.length ; k++) {
              var ep = episodes[k];
              var option = document.createElement('option');
              option.value=k;
              option.text=ep.season+'x'+ep.episode+' - '+ep.title;
              select.add(option);
            }
            tdSyn.innerHTML = episodes[0].overview;
          })
        })
        btnPlay.addEventListener('click', function(){
          var ep = episodes[select.value];
          var url = (ep.torrents['720p'] || ep.torrents['480p'] || ep.torrents['0']).url;
          mediaInfo.imdb_id = result.imdb_id;
          mediaInfo.name = result.title + ' ' + ep.season+'x'+ep.episode + ' ' + ep.title;
          playUri(url);
        })
        select.addEventListener('change', function(){
          tdSyn.innerHTML = episodes[select.value].overview;
        })
        table.appendChild(tr);
      })(results[i]);
    }
    var container = document.querySelector('#results');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(table);
  });
}
loadResults();

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
