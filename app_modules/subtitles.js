/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * subtitles.js - Subtitles utilities
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * Subtitles
 */
function Subtitles() {

  this.updateSubtitles = function() {};
  this.OpenSubtitles = new (require('opensubtitles-api'))('OSTestUserAgent');

  inputFileSubtitles.addEventListener('change', (function() {
    this.loadSubtitles(inputFileSubtitles.value);
  }).bind(this));

  btnLoadOpenSubtitles.addEventListener('click', (function() {
    this.searchSubtitles();
  }).bind(this));

  selectOpenSubtitles.addEventListener('change', (function () {
    this.loadSubtitles(selectOpenSubtitles.value);
  }).bind(this));
}

/**
 * Setup subtitles from local or distant .srt file
 *
 * @param uri { string } - URI for the subtitles file
 *                         can be a HTTP URL or a local file path to a .srt file
 */
Subtitles.prototype.loadSubtitles = function (uri) {

  if(new RegExp('^http://').test(uri)) {

    var dir = '/tmp';
    var name = new Date().getTime() + '.srt';
    var path = dir+'/'+name;

    new (require('download'))()
        .get(uri)
        .dest(dir)
        .rename(name)
        .run((function() {
          this.loadSubtitlesFromPath(path);
        }).bind(this));

  } else {
    this.loadSubtitlesFromPath(uri);
  }
}

/**
 * Setup subtitles from local .srt file
 *
 * @param path { string } - local file path for the .srt file
 */
Subtitles.prototype.loadSubtitlesFromPath = function (path) {

  require('fs').readFile(path, 'utf-8', (function(err, data) {

    this.updateSubtitles = require('subplay')(data, function(text) {
      subtitles_container.innerHTML = text;
    });

  }).bind(this));
}

/**
 * Get available subtitles from OpenSubtitles for the media currently playing
 */
Subtitles.prototype.searchSubtitles = function () {

  this.OpenSubtitles.search({

    sublanguageid: 'en',
    // search by hash
    hash: app.mediaInfo.os_hash,
    // search by imdb_id + season x episode
    imdbid: app.mediaInfo.imdb_id,
    episode: app.mediaInfo.episode_nb,
    season: app.mediaInfo.season_nb,
    // filename: mediaInfo.title,
    // query: mediaInfo.name,

  }).then((function (subtitles) {

    while (selectOpenSubtitles.firstChild) {
      selectOpenSubtitles.removeChild(selectOpenSubtitles.firstChild);
    }
    for (var i in subtitles) {
      var option = document.createElement('option');
      option.value = subtitles[i].url;
      option.text  = i;
      selectOpenSubtitles.add(option);
    }

  }).bind(this));
}

/**
 * Subtitles - compute OpenSubtitles hash
 *
 * @param mediaInfo { MediaInfo }
 *
 * @return { MediaInfo }
 */
Subtitles.prototype.getOpenSubtitlesHash = function () {

  var path;
  if (new RegExp('http://').test(app.mediaInfo.mrl)) {
    path = app.mediaInfo.filepath;
  }
  else if (new RegExp('file://').test(app.mediaInfo.mrl)) {
    path = app.mediaInfo.mrl.substring(7)
  } else {
    path = app.mediaInfo.mrl;
  }
  this.OpenSubtitles.extractInfo(path)
  .then(function (infos) {
      app.mediaInfo.os_hash = infos.moviehash;
      app.gui.updateMediaInfo(app.mediaInfo);
  });
}
