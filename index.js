/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * index.js - Main file
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

/*
 * throttle event window.resize using requestAnimationFrame
 * since we will use it to resize the video
 */

var throttleEvent = function(type, name, obj) {
  var obj = obj || window;
  var running = false;
  var func = function() {
    if (running) { return; }
    running = true;
    requestAnimationFrame(function() {
      obj.dispatchEvent(new CustomEvent(name));
      running = false;
    });
  };
  obj.addEventListener(type, func);
};
throttleEvent('resize', 'optimizedResize');

/*
 * utility to select a file on the disk
 */

function selectFile(cb) {
  var listener = function(){
    if(typeof cb == 'function') cb(dInputFile.value);
    dInputFile.removeEventListener('change',listener);
  }
  dInputFile.addEventListener('change',listener);
  dInputFile.click();
}

/*
 * init player
 */

var gPlayer = new (require('./app_modules/player'))(dPlayer,Event);

window.addEventListener('optimizedResize', function() {
  gPlayer.resize();
});

gPlayer.on('playing',function(){
  if(!gPlaying) onPlaying();
})

var gTracksman = new (require('./app_modules/tracksman'))(gPlayer);
gTracksman.mediaInfo = new (require('./app_modules/mediainfo'))();

var lang = 'en';  // TODO

gTracksman.on('playing',function() {
  var audio = gTracksman.audioTracks;
  for(var i=0 ; i<audio.length ; i++) {
    if(audio[i].lang == lang) {
      gTracksman.audio(i);
    }
  }
});

gTracksman.on('audio',refreshAudio);
gTracksman.on('subtitles',refreshSubtitles);

/*
 * init UI
 */

function makeVisible(e,visible){
  e.style.display = visible ? 'block' : 'none';
}

dHome.addEventListener('click',function(){
  selectFile(playFile);
})

/*
 * audio management
 */

function clearAudio(){
  while (dAudioTable.firstChild) {
    dAudioTable.removeChild(dAudioTable.firstChild);
  }
}

function refreshAudio(){
  clearAudio();
  var audio = gTracksman.audioTracks;
  var active = gTracksman.activeAudioTrack;
  for(var i=0 ; i<audio.length ; i++) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.appendChild(document.createTextNode(audio[i].name));
    tr.appendChild(td);
    tr.className = active==i ? 'active' : '';
    (function(i){
      tr.addEventListener('click',function(){
        gTracksman.audio(i);
      });
    })(i);
    dAudioTable.appendChild(tr);
  }
}

/*
 * subtitles management
 */

function clearSubtitles(){
 while (dSubtitlesTable.firstChild) {
   dSubtitlesTable.removeChild(dSubtitlesTable.firstChild);
 }
}

function refreshSubtitles(){
  clearSubtitles();
  var subtitles = gTracksman.subtitlesTracks;
  var active = gTracksman.activeSubtitlesTrack;
  for(var i=0 ; i<subtitles.length ; i++) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.appendChild(document.createTextNode(subtitles[i].name));
    tr.appendChild(td);
    tr.className = active==i ? 'active' : '';
    (function(i){
      tr.addEventListener('click',function(){
        gTracksman.subtitles(i);
      });
    })(i);
    dSubtitlesTable.appendChild(tr);
  }
}

dSubtitlesSearch.addEventListener('click',function(){
  gTracksman.searchSubtitles(lang,1,function(){
  });
});
dSubtitlesLoad.addEventListener('click',function(){
  selectFile(function(path){
    gTracksman.addSubtitles(path);
  });
});
dSubtitlesDisable.addEventListener('click',function(){
  gTracksman.subtitles(-1);
});

/*
 * General
 */

var gPlaying = false;

function onPlaying(){
  gPlaying = true;
  makeVisible(dHome,false);
  gPlayer.seek(50000);
  makeVisible(dAudio,false);
  makeVisible(dSubtitles,false);
}

function onStop(){
  gPlaying = false;
  makeVisible(dHome,true);
  makeVisible(dAudio,false);
  makeVisible(dSubtitles,false);
  clearAudio();
  clearSubtitles();
}

function playFile(path) {
  gTracksman.mediaInfo.filepath = path;
  gPlayer.play(path);
}

makeVisible(dHome,true);
makeVisible(dWelcome,false);
makeVisible(dAudio,false);
makeVisible(dSubtitles,false);
