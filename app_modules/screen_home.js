/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * screen_home.js - Screen "home" manager
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * ScreenHome
 *
 * Setup and configure GUI components
 */
function ScreenHome() {

  // these should be set by class user
  this.cmd                 = function() {};
  this.identifyMediaType   = function() {};
  this.showOpenFileDialog  = function() {};
  this.getClipboardContent = function() {};

  // connect buttons and inputs

  inputFile.addEventListener('change', (function() {
    this.cmd('play', inputFile.value);
  }).bind(this));

  btnChooseFile.addEventListener('click', (function() {
    this.showOpenFileDialog();
  }).bind(this));

  btnUriOpen.addEventListener('click', (function() {
    this.cmd('play', inputUri.value);
  }).bind(this));

  btnUriPaste.addEventListener('click', (function() {
    this.cmd('play', this.getClipboardContent());
  }).bind(this));

  // init drag'n drop

  // detect media type and provide visual feedback on dragover
  home.ondragover = (function (e) {
    home.className = 'hover';

    var files    = e.dataTransfer.files;
    var filepath = files[0] && files[0].path;

    var hint1 = '';
    var hint2 = '';

    if (filepath) {
      hint1 = filepath;
      hint2 = this.identifyMediaType(filepath);
    }
    dropHint1.innerHTML = hint1;
    dropHint2.innerHTML = hint2;

    return false;
  }).bind(this);
  home.ondragleave = function () {
    this.className = '';
    return false;
  };

  // open file on drop
  home.ondrop = (function (e) {
    e.preventDefault();

    var files    = e.dataTransfer.files;
    var filepath = files[0] && files[0].path;

    if (filepath) {
      this.cmd('play', filepath);
    }
    return false;
  }).bind(this);
}
