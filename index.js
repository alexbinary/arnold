



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
    getOpenSubtitlesHash();
    selectAudio.value = player.vlc.audio.track;
    selectSubtitles.value = player.vlc.subtitles.track;

    // var i = player.vlc.playlist.add('/Users/alexandrebintz/Downloads/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt');
    // console.log(player.vlc.playlist.playItem(i));

    console.log(player);
  }
  player.vlc.onTimeChanged = function(time) {
    updateSubtitles(time/1000);
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
  console.log(mediaInfo);
  OpenSubtitles.search({
      sublanguageid: 'en',
      // search by hash
      hash: mediaInfo.os_hash,
      // search by imdb_id + season x episode
      imdbid: mediaInfo.imdb_id,
      episode: mediaInfo.episode_nb,
      season: mediaInfo.season_nb,
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
          mediaInfo.episode_nb = ep.episode;
          mediaInfo.season_nb = ep.season;
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
