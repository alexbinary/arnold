/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * index.js - Main file
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

onload = function(){

  var selectFile = require('./app_modules/selectfile')($);

  function makeVisible(e,visible){
    $(e).toggle(visible);
  }

  var lang = 'en';

  /*
   * player
   */

  var gPlayer = new (require('./app_modules/player'))(dPlayer,Event);

  gPlayer.on('started',onStarted);
  gPlayer.on('stopped',onStopped);

  function showPlayer(){
    $(dPlayer).show();
  }
  function hidePlayer(){
    $(dPlayer).hide();
  }

  /*
   * tracks manager
   */

  var gTracksman = new (require('./app_modules/tracksman'))(gPlayer);

  gTracksman.on('started',function() {
    gTracksman.audio(lang);
    gTracksman.subtitles(null);
  });

  gTracksman.on('subtitles',refreshSubtitles);

  /*
   * open file
   */

  function pickAndOpenMediaFile(){
    selectFile(openFile);
  }

  dHomeDropZone.addEventListener('click',function(){
    pickAndOpenMediaFile();
  })

  dHomeDropZone.ondragover = function(){
   $(this).addClass('hover');
  };
  dHomeDropZone.ondragleave = function(){
   $(this).removeClass('hover');
  };
  dHomeDropZone.ondrop = function(e){
   $(this).removeClass('hover');
   var filepath = e
               && e.dataTransfer
               && e.dataTransfer.files
               && e.dataTransfer.files[0]
               && e.dataTransfer.files[0].path;
   if(filepath) openFile(filepath);
  };

  document.body.ondragover = function(){
   return false;
  };
  document.body.ondragleave = function(){
   return false;
  };
  document.body.ondrop = function(e){
   return false;
  };

  /*
   * general controls
   */

  $(window).keydown(function(e){
    if (e.which == 32  // space
    ){
     gPlayer.togglePause();
     return;
    }
    if(audioWidget.visible) {
      if(audioWidget.keydown(e)) return;
    }
    if(subtitlesVisible) subtitlesKeydown(e);
  });

  dPlayer.addEventListener('click',function(){
   gPlayer.togglePause();
  });

  /*
   * home screen
   */

  function showHome(){
    makeVisible(dHome,true);
  }
  function hideHome(){
    makeVisible(dHome,false);
  }

  /*
   * audio management
   */

  var audioWidget = new (require('./app_modules/audio'))(dAudioWidget,gTracksman);

  /*
   * application menu
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
      toggleSubtitlesVisible();
    },'l','ctrl'
    ),
    mb.item('Manage audio',function(){
      audioWidget.toggleVisible();
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
        dSubtitlesSearch.click();
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
    // select "disable subtitles" if nothing is selected
    if(typeof gTracksman.activeSubtitlesTrack == 'undefined'){
      if(!$(dSubtitlesSearch).hasClass('active')
      && !$(dSubtitlesLoad).hasClass('active')
      && !$(dSubtitlesDisable).hasClass('active')){
        if(openSubtitlesFired){
          $(dSubtitlesSearch).addClass('active');
          $(dSubtitlesLoad).removeClass('active');
          $(dSubtitlesDisable).removeClass('active');
        } else {
          $(dSubtitlesDisable).addClass('active');
          $(dSubtitlesSearch).removeClass('active');
          $(dSubtitlesLoad).removeClass('active');
        }
      }
    } else {
      $(dSubtitlesSearch).removeClass('active');
      $(dSubtitlesLoad).removeClass('active');
      $(dSubtitlesDisable).removeClass('active');
    }
  }

  dSubtitlesSearch.addEventListener('click',function(){
    openSubtitlesFired = true;
    $(dSubtitlesDisable).removeClass('active');
    gTracksman.subtitles(null);
    $(dSubtitlesSearch).find('td').text('Loading subtitles...');
    gTracksman.searchSubtitles(lang,1,function(){
      openSubtitlesComplete = true;
      gTracksman.subtitles(gTracksman.subtitlesTracks.length-1);
      $(dSubtitlesSearch).removeClass('active');
      $(dSubtitlesSearch).hide();
    });
  });
  dSubtitlesLoad.addEventListener('click',function(){
    selectFile(function(path){
      gTracksman.addSubtitles(path);
      gTracksman.subtitles(gTracksman.subtitlesTracks.length-1);
      hideSubtitles();
      $(dSubtitlesLoad).removeClass('active');
    });
  });
  dSubtitlesDisable.addEventListener('click',function(){
    gTracksman.subtitles(-1);
  });

  var subtitlesVisible = true;

  function showSubtitles(){
    makeVisible(dSubtitles,true);
    subtitlesVisible = true;
  }
  function hideSubtitles(){
    makeVisible(dSubtitles,false);
    subtitlesVisible = false;
  }
  function toggleSubtitlesVisible(){
    subtitlesVisible ? hideSubtitles() : showSubtitles();
  }

  var openSubtitlesFired = false;
  var openSubtitlesComplete = false;

  function subtitlesKeydown(e){
    if (e.keyCode == 13 // enter
     || e.keyCode == 27 // escape
    ){
      if($(dSubtitlesDisable).hasClass('active')){
        dSubtitlesDisable.click();
        hideSubtitles();
      } else if($(dSubtitlesLoad).hasClass('active')){
        dSubtitlesLoad.click();
      } else if($(dSubtitlesSearch).hasClass('active')){
        if(!openSubtitlesFired){
          dSubtitlesSearch.click();
          hideSubtitles();
        }
      } else {
        hideSubtitles();
      }
    } else if (e.keyCode == 38  // up arrow
    ){
      var count = gTracksman.subtitlesTracks.length;
      var active = gTracksman.activeSubtitlesTrack;

      if(typeof gTracksman.activeSubtitlesTrack == 'undefined'){
        if($(dSubtitlesDisable).hasClass('active')){
          $(dSubtitlesDisable).removeClass('active');
          $(dSubtitlesLoad).addClass('active');
        } else if($(dSubtitlesLoad).hasClass('active')){
          $(dSubtitlesLoad).removeClass('active');
          if(openSubtitlesComplete){
            active=count-1;
          } else {
            $(dSubtitlesSearch).addClass('active');
          }
        } else if($(dSubtitlesSearch).hasClass('active')){
          $(dSubtitlesSearch).removeClass('active');
          active=count-1;
        } else if(count>0){
          active = 0;
        } else {
          $(dSubtitlesSearch).addClass('active');
        }
      } else {
        if(active == 0){
          active = null;
          $(dSubtitlesDisable).addClass('active');
        }
        else active--;
      }
      gTracksman.subtitles(active);
      refreshSubtitles();
    } else if (e.keyCode == 40  // down arrow
    ){
      var count = gTracksman.subtitlesTracks.length;
      var active = gTracksman.activeSubtitlesTrack;

      if(typeof gTracksman.activeSubtitlesTrack == 'undefined'){
        if($(dSubtitlesSearch).hasClass('active')){
          $(dSubtitlesSearch).removeClass('active');
          $(dSubtitlesLoad).addClass('active');
        } else if($(dSubtitlesLoad).hasClass('active')){
          $(dSubtitlesLoad).removeClass('active');
          $(dSubtitlesDisable).addClass('active');
        } else if($(dSubtitlesDisable).hasClass('active')){
          $(dSubtitlesDisable).removeClass('active');
          if(count>0){
            active = 0;
          } else {
            $(dSubtitlesSearch).addClass('active');
          }
        } else if(count>0){
          active = 0;
        } else {
          $(dSubtitlesSearch).addClass('active');
        }
      } else {
        if(active == count-1){
          active = null;
          if(openSubtitlesComplete){
            $(dSubtitlesLoad).addClass('active');
          } else {
            $(dSubtitlesSearch).addClass('active');
          }
        }
        else active++;
      }
      gTracksman.subtitles(active);
      refreshSubtitles();
    }
  }

  /*
   * application logic
   */

  function openFile(path) {
    gTracksman.mediaInfo.filepath = path;
    gPlayer.play(path);
  }

  function onStarted(){
    audioWidget.hide();
    hideSubtitles();
    hideHome();
    showPlayer();
    //
    gPlayer.volume(50);
  }

  function onStopped(){
    hidePlayer();
    audioWidget.hide();
    hideSubtitles();
    showHome();

    clearAudio();
    clearSubtitles();
  }

  hidePlayer();
  audioWidget.hide();
  hideSubtitles();
  showHome();

  require('nw.gui').Window.get().show();

  // --

  require('nw.gui').Window.get().showDevTools();
  // require('nw.gui').Window.get().moveTo(20,100);
  openFile('/Users/alexandrebintz/Movies/another_earth_2011_1080p_it_eng_es_fr_sub_it_eng_es_fr_de_da_ne_nor_su.mkv');
  // openFile('/Users/alexandrebintz/Movies/The.Big.Bang.Theory.S09E01.720p.HDTV.X264-DIMENSION[EtHD].mkv');

};
