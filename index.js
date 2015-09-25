var canvas = document.getElementById("canvas");



// =============================================================================
// Display
//

var arnoldGui = new ArnoldGui();

function reload() {
  require('nw.gui').Window.get().reloadDev();
}

var mediaInfo = {};

// =============================================================================
// Subtitles

var subtitles = new Subtitles();

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
// Main
//

var arnold = new Arnold();
var player = arnold.player;





// =============================================================================
// =============================================================================
// dev
//
// require('nw.gui').Window.get().showDevTools();
// playLocalMediaFile('/Users/alexandrebintz/Movies/family_matters_1x22_rock_video.avi');
// playUri('/Users/alexandrebintz/Movies/another_earth_2011_1080p_it_eng_es_fr_sub_it_eng_es_fr_de_da_ne_nor_su.mkv');
// var path = '/Users/alexandrebintz/Movies/Another.Earth.2011.BDRip.x264.AC3-Zoo.eng.srt';
// loadSubtitles(path);
