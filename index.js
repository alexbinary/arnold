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

  gPlayer.on('timeChanged',function(time){
    $(dPlayerHintTime).text(
      require('time-format-utils').millisecondsToHhmmss(time)+
      ' / '+
      require('time-format-utils').millisecondsToHhmmss(gPlayer.length())
    );
  });

  gPlayer.on('downloading',function(downloading){
    $(dSubtitlesHintDownloading).toggle(downloading);
  });

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
    $(dSubtitlesHintSearching).toggle(loading);
  });
  subtitlesWidget.on('searchFailure',function(err){
    $(dSubtitlesHintSearching).toggle(false);
    onError(err ? err : 'no subtitles found');
  });

  /*
   * application menu
   */

  var mb = new (require('./app_modules/menubuilder'))(require('nw.gui'));

  mb.initMenuBar();
  mb.createMacBuiltin();

  var miPlay,miStop,
      miJumpF1,miJumpF2,miJumpF3,
      miJumpB1,miJumpB2,miJumpB3,
      miMute,miVolumeUp,miVolumeDown,
      miToggleTime,miToggleSubtitles,
      miManageSubtitles,miManageAudio;

  mb.menu('Play',[

    miPlay = mb.item('Open file',function(){
      pickAndOpenMediaFile();
    },'o','cmd'
    ),
    mb.separator(
    ),
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
    miJumpF1 = mb.item('Jump +1s',function(){
     gPlayer.jump(+1000*1);
    },
     String.fromCharCode(29), // arrow right
     'shift'
    ),
    miJumpF2 = mb.item('Jump +10s',function(){
     gPlayer.jump(+1000*10);
    },
     String.fromCharCode(29), // arrow right
     'alt'
    ),
    miJumpF3 = mb.item('Jump +1min',function(){
     gPlayer.jump(+1000*60);
    },
     String.fromCharCode(29), // arrow right
     'cmd'
    ),
    mb.separator(
    ),
    miJumpB1 = mb.item('Jump -1s',function(){
     gPlayer.jump(-1000*1);
    },
     String.fromCharCode(28), // arrow left
     'shift'
    ),
    miJumpB2 = mb.item('Jump -10s',function(){
     gPlayer.jump(-1000*10);
    },
     String.fromCharCode(28), // arrow left
     'alt'
    ),
    miJumpB3 = mb.item('Jump -1min',function(){
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
    miToggleTime = mb.item('Toggle time',function(){
     $(dPlayerHintTime).toggle();
    },'t'
    ),
    mb.separator(
    ),
    miMute = mb.item('Mute/Unmute',function(){
      gPlayer.toggleMute();
    },'m','ctrl'
    ),
    miVolumeUp = mb.item('Increase volume',function(){
      gPlayer.volume(gPlayer.volume()+10);
    },
     String.fromCharCode(30), // arrow up
     'cmd'
    ),
    miVolumeDown = mb.item('Decrease volume',function(){
      gPlayer.volume(gPlayer.volume()-10);
    },
      String.fromCharCode(31), // arrow down
      'cmd'
    ),
    mb.separator(
    ),
    miToggleSubtitles = mb.item('Toggle subtitles',function(){
      subtitlesWidget.toggleSubtitles();
    },'l'),
    miManageSubtitles = mb.item('Manage subtitles',function(){
      subtitlesWidget.toggleVisible();
      if(subtitlesWidget.visible) audioWidget.hide();
    },'l','ctrl'
    ),
    mb.separator(
    ),
    miManageAudio = mb.item('Manage audio',function(){
      audioWidget.toggleVisible();
      if(audioWidget.visible) subtitlesWidget.hide();
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
    $(dPlayerHintTime).hide();
    miPlay.enabled = true;
    miStop.enabled = true;
    miJumpF1.enabled = true;
    miJumpF2.enabled = true;
    miJumpF3.enabled = true;
    miJumpB1.enabled = true;
    miJumpB2.enabled = true;
    miJumpB3.enabled = true;
    miMute.enabled = true;
    miVolumeUp.enabled = true;
    miVolumeDown.enabled = true;
    miToggleTime.enabled = true;
    miToggleSubtitles.enabled = true;
    miManageSubtitles.enabled = true;
    miManageAudio.enabled = true;
  }
  function onPlayStopped(){
    onPaused();
    audioWidget.hide();
    subtitlesWidget.hide();
    subtitlesWidget.initState();
    $(dHome).show();
    $(dPlayer).hide();
    $(dPlayerHintTime).hide();
    miPlay.enabled = false;
    miStop.enabled = false;
    miJumpF1.enabled = false;
    miJumpF2.enabled = false;
    miJumpF3.enabled = false;
    miJumpB1.enabled = false;
    miJumpB2.enabled = false;
    miJumpB3.enabled = false;
    miMute.enabled = false;
    miVolumeUp.enabled = false;
    miVolumeDown.enabled = false;
    miToggleTime.enabled = false;
    miToggleSubtitles.enabled = false;
    miManageSubtitles.enabled = false;
    miManageAudio.enabled = false;
  }
  function onPlaying(){
    miPlay.label = 'Pause';
  }
  function onPaused(){
    miPlay.label = 'Play';
  }

  $(dError).hide();
  $(dSubtitlesHintSearching).hide();
  $(dSubtitlesHintDownloading).hide();
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
