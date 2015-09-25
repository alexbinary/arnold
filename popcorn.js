/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * popcorn.js - Wrapper for Popcorn Time API
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * Popcorn
 */
function Popcorn() {

  this.request = require('request');
  this.loading = document.querySelector('#loading');

  document.querySelector('#buttonSearch').addEventListener('click', function() {
    this.loadResults(document.querySelector('#inputSearch').value);
  });
}

Popcorn.prototype.showLoading = function () {
  this.loading.style.visibility='visible';
}
Popcorn.prototype.hideLoading = function () {
  this.loading.style.visibility='hidden';
}

Popcorn.prototype.loadResults = function (keywords) {
  this.showLoading();
  var url = 'http://eztvapi.re/shows/1';
  if(keywords) {
    url += '?keywords='+encodeURIComponent(keywords);
  }
  this.request(url, (function(error, res, body) {
    var results = JSON.parse(body);
    this.hideLoading();
    var table = document.createElement('table');
    for(var i=0 ; i<results.length ; i++) {
      (function(result) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        var img = new Image();
        img.src = result.images['poster'];
        img.width = 50;
        td.appendChild(img);
        tr.appendChild(td);
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(result.title));
        tr.appendChild(td);
        var td = document.createElement('td');
        var btnLoad = document.createElement('button');
        btnLoad.appendChild(document.createTextNode('Load episode list'));
        td.appendChild(btnLoad);
        tr.appendChild(td);
        var td = document.createElement('td');
        var select = document.createElement('select');
        td.appendChild(select);
        tr.appendChild(td);
        var td = document.createElement('td');
        var btnPlay = document.createElement('button');
        btnPlay.appendChild(document.createTextNode('Play'));
        td.appendChild(btnPlay);
        tr.appendChild(td);
        var tdSyn = document.createElement('td');
        tr.appendChild(tdSyn);
        var episodes = [];
        btnLoad.addEventListener('click', (function(){
          this.showLoading();
          this.request('http://eztvapi.re/show/'+result._id, (function(error, res, body) {
            episodes = JSON.parse(body).episodes;
            this.hideLoading();
            for(var k=0 ; k<episodes.length ; k++) {
              var ep = episodes[k];
              var option = document.createElement('option');
              option.value=k;
              option.text=ep.season+'x'+ep.episode+' - '+ep.title;
              select.add(option);
            }
            tdSyn.innerHTML = episodes[0].overview;
          }).bind(this))
        }).bind(this))
        btnPlay.addEventListener('click', function(){
          var ep = episodes[select.value];
          var url = (ep.torrents['720p'] || ep.torrents['480p'] || ep.torrents['0']).url;
          arnold.mediaInfo.imdb_id = result.imdb_id;
          arnold.mediaInfo.episode_nb = ep.episode;
          arnold.mediaInfo.season_nb = ep.season;
          arnold.mediaInfo.name = result.title + ' ' + ep.season+'x'+ep.episode + ' ' + ep.title;
          playUri(url);
        })
        select.addEventListener('change', function(){
          tdSyn.innerHTML = episodes[select.value].overview;
        })
        table.appendChild(tr);
      }).bind(this)(results[i]);
    }
    var container = document.querySelector('#results');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(table);
  }).bind(this));
}
