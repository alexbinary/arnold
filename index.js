/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * index.js - Main file
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var $ = require('jquery');

onload = function(){

  var selectFile = require('./app_modules/selectfile')($);

  /*
   * default lang for audio and subtitles
   */

  var lang = 'en';

  /*
   * player
   */

  var gPlayer = new (require('./app_modules/player'))(dPlayer,Event);

  gPlayer.on('started',onPlayStarted);
  gPlayer.on('stopped',onPlayStopped);

  gPlayer.on('playing',onPlaying);
  gPlayer.on('paused',onPaused);

  /*
   * tracks manager
   */

  var gTracksman = new (require('./app_modules/tracksman'))(gPlayer);

  gTracksman.on('started',function() {
    gTracksman.audio(lang);
    gTracksman.subtitles(null);
  });

  /*
   * open file
   */

  function pickAndOpenMediaFile(){
    selectFile(openFile);
  }

  dHomeDropZone.addEventListener('click',function(){
    pickAndOpenMediaFile();
  })

  document.body.ondragover = function(e){
    e.preventDefault();
    $(this).addClass('dragover');
  };
  document.body.ondragleave = function(e){
    e.preventDefault();
    $(this).removeClass('dragover');
  };
  document.body.ondrop = function(e){
    e.preventDefault();
    $(this).removeClass('dragover');
    var filepath = e
                && e.dataTransfer
                && e.dataTransfer.files
                && e.dataTransfer.files[0]
                && e.dataTransfer.files[0].path;
    if(filepath){
      if(filepath.endsWith('.srt') && gPlayer.playing){
        gTracksman.subtitles(gTracksman.addSubtitles(filepath));
      }else{
        openFile(filepath);
      }
    }
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
    if(subtitlesWidget.visible) {
      if(subtitlesWidget.keydown(e)) return;
    }
  });

  dPlayer.addEventListener('click',function(){
   gPlayer.togglePause();
  });

  /*
   * audio & subtitles
   */

  var audioWidget = new (require('./app_modules/audio'))(
    dAudioWidget,gTracksman
  );

  var subtitlesWidget = new (require('./app_modules/subtitles'))(
    dSubtitlesWidget,gTracksman,selectFile
  );
  subtitlesWidget.on('loading',function(loading){
    $(dSubtitlesHint).toggle(loading);
  });
  subtitlesWidget.on('searchFailure',function(err){
    $(dSubtitlesHint).toggle(false);
    onError(err ? err : 'no subtitles found');
  });

  /*
   * application menu
   */

  var mb = new (require('./app_modules/menubuilder'))(require('nw.gui'));

  mb.initMenuBar();
  mb.createMacBuiltin();

  var miPlay,miStop;

  mb.menu('Play',[

    miPlay = mb.item('Play/Pause',function(){
      gPlayer.togglePause();
    },'p','cmd'
    ),
    miStop = mb.item('Stop',function(){
      gPlayer.stop();
    },'s','cmd'
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
    mb.separator(
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

  mb.menu('Video',[

    mb.item('Fullscreen',function(){
     require('nw.gui').Window.get().toggleFullscreen();
    },'f','cmd'
    ),
    mb.separator(
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
    mb.separator(
    ),
    mb.item('Toggle subtitles',function(){
      if(gPlayer.playing) subtitlesWidget.toggleSubtitles();
    },'l'),
    mb.item('Manage subtitles',function(){
      subtitlesWidget.toggleVisible();
    },'l','ctrl'
    ),
    mb.separator(
    ),
    mb.item('Manage audio',function(){
      audioWidget.toggleVisible();
    },'b','ctrl'
    ),
  ]);

  /*
   * error handling
   */

  process.on('uncaughtException',onError);
  process.on('unhandledRejection',onError);

  function onError(err){
    $(dErrorText).text(err);
    $(dError).toggle(true);
  }
  $(dError).on('click',function(){
    $(dError).fadeOut('fast');
  })

  /*
   * application logic
   */

  function openFile(path) {
    gTracksman.mediaInfo.filepath = path;
    gPlayer.play(path);
  }

  function onPlayStarted(){
    audioWidget.hide();
    subtitlesWidget.hide();
    $(dHome).hide();
    $(dPlayer).show();
    miPlay.enabled = true;
    miStop.enabled = true;
  }
  function onPlayStopped(){
    onPaused();
    audioWidget.hide();
    subtitlesWidget.hide();
    $(dHome).show();
    $(dPlayer).hide();
    miPlay.enabled = false;
    miStop.enabled = false;
  }
  function onPlaying(){
    miPlay.label = 'Pause';
  }
  function onPaused(){
    miPlay.label = 'Play';
  }

  $(dError).hide();
  $(dSubtitlesHint).hide();
  onPlayStopped();

  setTimeout(function(){
    require('nw.gui').Window.get().show();
    require('nw.gui').Window.get().focus();

    var argv = require('nw.gui').App.argv;
    if(argv && argv.length > 0) {
      openFile(argv[0]);
    }
  },100);

  // --

  // require('nw.gui').Window.get().showDevTools();
  // require('nw.gui').Window.get().moveTo(20,100);
  // openFile('/Users/alexandrebintz/Movies/another_earth_2011_1080p_it_eng_es_fr_sub_it_eng_es_fr_de_da_ne_nor_su.mkv');
  // openFile('/Users/alexandrebintz/Movies/The.Big.Bang.Theory.S09E01.720p.HDTV.X264-DIMENSION[EtHD].mkv');

};
