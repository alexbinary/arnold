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

  this.updateSubtitles = function(){};
  this.OpenSubtitles = new (require('opensubtitles-api'))('OSTestUserAgent');

  var input = document.querySelector('#inputFileSubtitles');
  input.addEventListener('change', (function(){
    this.loadSubtitles(input.value);
  }).bind(this));
  document.querySelector('#buttonLoadSubtitles').addEventListener('click', (function(){
    this.searchSubtitles();
  }).bind(this));
}

Subtitles.prototype.loadSubtitles = function (path) {

  var srt = require('fs').readFileSync(path, 'utf-8');
  this.updateSubtitles = require('subplay')(srt, function(text) {
      document.querySelector('#subtitles').innerHTML = text;
  });
}

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
    select.addEventListener('change', (function () {
      var url = select.value;
      var name = new Date().getTime() + '.srt';
      var Download = require('download');
      new Download()
          .get(url)
          .dest('/tmp')
          .rename(name)
          .run((function() {
            this.loadSubtitles('/tmp/'+name);
          }).bind(this));
    }).bind(this))
  }).bind(this));
}

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
      app.gui.updateMediaInfo();
  });
}
