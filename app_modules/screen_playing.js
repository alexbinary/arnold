/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * screen_playing.js - Screen "playing" manager
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * ScreenPlaying
 *
 * Init UI components
 */
function ScreenPlaying() {

  // these should be set by class user
  this.cmd = function() {};

  selectAudio.addEventListener('change', (function () {
    this.cmd('setAudioTrack', +selectAudio.value);
  }).bind(this));

  selectSubtitles.addEventListener('change', (function () {
    this.cmd('setSubtitlesTrack', +selectSubtitles.value);
  }).bind(this));

  inputFileSubtitles.addEventListener('change', (function() {
    this.cmd('loadSubtitles', inputFileSubtitles.value);
  }).bind(this));

  btnLoadOpenSubtitles.addEventListener('click', (function() {
    this.cmd('searchSubtitles');
    openSubtitlesLoading.style.visibility = 'visible';
  }).bind(this));

  selectOpenSubtitles.addEventListener('change', (function () {
    this.cmd('loadSubtitles', selectOpenSubtitles.value);
  }).bind(this));
}

/**
 * ScreenPlaying - reflect new current audio track
 *
 * @param track { number }
 */
ScreenPlaying.prototype.onCurrentAudioTrackChanged = function (track) {

  selectAudio.value = track;
}

/**
 * ScreenPlaying - reflect new current subtitles track
 *
 * @param track { number }
 */
ScreenPlaying.prototype.onCurrentSubtitlesTrackChanged = function (track) {

  selectSubtitles.value = track;
}

/**
 * ScreenPlaying - reflect new media info
 *
 * @param mediaInfo { MediaInfo }
 */
ScreenPlaying.prototype.onMediaInfoChanged = function(mediaInfo) {

  mediaTitle.innerHTML  = mediaInfo.title;
  mediaIMDBID.innerHTML = mediaInfo.imdb_id;
  mediaHash.innerHTML   = mediaInfo.os_hash;

  var selectedAudio = selectAudio.value;
  while (selectAudio.firstChild) {
    selectAudio.removeChild(selectAudio.firstChild);
  }
  for (var i = 0; i < mediaInfo.audio.count; i++) {
    var option = document.createElement('option');
    option.value = i;
    option.text  = mediaInfo.audio[i];
    selectAudio.add(option);
  }
  selectAudio.value = selectedAudio;

  var selectedSubtitle = selectSubtitles.value;
  while (selectSubtitles.firstChild) {
    selectSubtitles.removeChild(selectSubtitles.firstChild);
  }
  for (var i = 0; i < mediaInfo.subtitles.count; i++) {
    var option = document.createElement('option');
    option.value = i;
    option.text  = mediaInfo.subtitles[i];
    selectSubtitles.add(option);
  }
  selectSubtitles.value = selectedSubtitle;
}

/**
 * ScreenPlaying - reflect OpenSubtitles search result
 *
 * @param subtitles { object (see opensubtitles-api) }
 */
ScreenPlaying.prototype.onOpenSubtitlesResult = function(subtitles) {

  openSubtitlesLoading.style.visibility = 'hidden';

  while (selectOpenSubtitles.firstChild) {
    selectOpenSubtitles.removeChild(selectOpenSubtitles.firstChild);
  }
  for (var i in subtitles) {
    var option = document.createElement('option');
    option.value = subtitles[i].url;
    option.text  = i;
    selectOpenSubtitles.add(option);
  }
  this.cmd('loadSubtitles', selectOpenSubtitles.value);
}

/**
 * ScreenPlaying - get currently selected OpenSubtitle item
 *
 * @return { string } file url
 */
ScreenPlaying.prototype.getSelectedOpenSubtitle = function() {

  return selectOpenSubtitles.value;
}
