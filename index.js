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

var mb = new (require('./app_modules/menubuilder'))(require('nw.gui'));

mb.initMenuBar();
mb.createMacBuiltin();

mb.menu('Play', [

  mb.item('Fullscreen',function(){
   require('nw.gui').Window.get().toggleFullscreen();
  },'f','cmd'
  ),
  mb.item('Play/Pause',function(){
    gPlayer.togglePause();
  },'p','cmd'
  ),
  mb.item('Stop',function(){
    gPlayer.stop();
  },'s','cmd'
  ),
  mb.item('Mute/Unmute',function(){
    gPlayer.toggleMute();
  },'m','ctrl'
  ),
  mb.item('Increase volume',function(){
    gPlayer.volume(gPlayer.volume()+10);
  },
   String.fromCharCode(30), // arrow up
   'cmd'
  ),
  mb.item('Decrease volume',function(){
    gPlayer.volume(gPlayer.volume()-10);
  },
    String.fromCharCode(31), // arrow down
    'cmd'
  ),
  mb.item('Toggle subtitles',function(){
    toggleSubtitles();
  },'l'),
  mb.item('Manage subtitles',function(){
    makeVisible(dSubtitles,true);
  },'l','ctrl'
  ),
  mb.item('Manage audio',function(){
    makeVisible(dAudio,true);
  },'b','ctrl'
  ),
  mb.separator(
  ),
  mb.item('Jump +1s',function(){
   gPlayer.jump(+1000*1);
  },
   String.fromCharCode(29), // arrow right
   'shift'
  ),
  mb.item('Jump +10s',function(){
   gPlayer.jump(+1000*10);
  },
   String.fromCharCode(29), // arrow right
   'alt'
  ),
  mb.item('Jump +1min',function(){
   gPlayer.jump(+1000*60);
  },
   String.fromCharCode(29), // arrow right
   'cmd'
  ),
  mb.item('Jump -1s',function(){
   gPlayer.jump(-1000*1);
  },
   String.fromCharCode(28), // arrow left
   'shift'
  ),
  mb.item('Jump -10s',function(){
   gPlayer.jump(-1000*10);
  },
   String.fromCharCode(28), // arrow left
   'alt'
  ),
  mb.item('Jump -1min',function(){
   gPlayer.jump(-1000*60);
  },
   String.fromCharCode(28), // arrow left
   'cmd'
  ),
]);

window.addEventListener('keypress',function(e){
  if (e.keyCode == 32) {  // space
    gPlayer.togglePause();
  }
});
dPlayer.addEventListener('click',function(){
  gPlayer.togglePause();
});

function makeVisible(e,visible){
  $(e).toggle(visible);
}

dHomeDropZone.addEventListener('click',function(){
  selectFile(playFile);
})

dHomeDropZone.ondragover = function(){$(this).addClass('hover');};
dHomeDropZone.ondragleave = function(){$(this).removeClass('hover');};
dHomeDropZone.ondrop = function(e){
  e.preventDefault();
  var filepath = e
              && e.dataTransfer
              && e.dataTransfer.files
              && e.dataTransfer.files[0]
              && e.dataTransfer.files[0].path;
  if(filepath) playFile(filepath);
  return false;
};

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

window.addEventListener('keydown',function(e){
  if (e.keyCode == 13 // enter
   || e.keyCode == 27 // escape
  ){
    makeVisible(dAudio,false);
  } else if (e.keyCode == 38  // up arrow
  ){
    var count = gTracksman.audioTracks.length;
    var active = gTracksman.activeAudioTrack;
    if(active == 0) active=count-1;
    else active--;
    gTracksman.audio(active);
    refreshAudio();
  } else if (e.keyCode == 40  // down arrow
  ){
    var count = gTracksman.audioTracks.length;
    var active = gTracksman.activeAudioTrack;
    if(active == count-1) active=0;
    else active++;
    gTracksman.audio(active);
    refreshAudio();
  }
});

/*
 * subtitles management
 */

var gLastSubtitlesTrack = undefined;

function enableSubtitles(){
  if(typeof gLastSubtitlesTrack != 'undefined') {
    gTracksman.subtitles(gLastSubtitlesTrack);
  } else {
    var subtitles = gTracksman.subtitlesTracks;
    if(subtitles.length > 0) {
      for(var i=0 ; i<subtitles.length ; i++) {
        if(subtitles[i].lang == lang) {
          gTracksman.subtitles(i);
          break;
        }
      }
    }
    if(typeof gTracksman.activeSubtitlesTrack == 'undefined') {
      searchAndLoadSubtitles();
    }
  }
}

function disableSubtitles(){
  gLastSubtitlesTrack = gTracksman.activeSubtitlesTrack;
  gTracksman.subtitles(-1);
}

function toggleSubtitles(){
  if(typeof gTracksman.activeSubtitlesTrack == 'undefined') enableSubtitles();
  else disableSubtitles();
}

function searchAndLoadSubtitles(){
  console.log('loading subs');
  gTracksman.searchSubtitles(lang,1,function(found){
    console.log('done loading subs');
    if(found) {
      console.log('found subs');
      gTracksman.subtitles(gTracksman.subtitlesTracks.length-1);
    } else {
      console.log('no subs found');
    }
  });
}

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
  $(dPlayer).addClass('playing');
  makeVisible(dHome,false);
  makeVisible(dAudio,false);
  makeVisible(dSubtitles,false);
}

function onStop(){
  gPlaying = false;
  $(dPlayer).removeClass('playing');
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
makeVisible(dAudio,false);
makeVisible(dSubtitles,false);

// require('nw.gui').Window.get().showDevTools();
// require('nw.gui').Window.get().moveTo(20,100);
// playFile('/Users/alexandrebintz/Movies/another_earth_2011_1080p_it_eng_es_fr_sub_it_eng_es_fr_de_da_ne_nor_su.mkv');
// playFile('/Users/alexandrebintz/Movies/The.Big.Bang.Theory.S09E01.720p.HDTV.X264-DIMENSION[EtHD].mkv');
