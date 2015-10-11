/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * audio.js - Audio manager widget
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var $ = require('jquery');

function AudioWidget(root,tracksman){
  this.uiRoot = $(root);
  this.uiTable = this.uiRoot.find('.audioTable');
  this.tracksman = tracksman;
  this.tracksman.on('audio',this.refresh.bind(this));
  this.refresh();
}
module.exports = AudioWidget;

AudioWidget.prototype.show = function(){
  this.uiRoot.show();
  this.visible = true;
}
AudioWidget.prototype.hide = function(){
  this.uiRoot.hide();
  this.visible = false;
}
AudioWidget.prototype.toggleVisible = function(){
  this.visible ? this.hide() : this.show();
}
AudioWidget.prototype.clear = function(){
  this.uiTable.children().remove();
}
AudioWidget.prototype.refresh = function(){
  this.clear();
  this.tracks = this.tracksman.audioTracks;
  this.activeTrack = this.tracksman.activeAudioTrack;
  for(var i=0 ; i<this.tracks.length ; i++) {
    var tr = $('<tr></tr>');
    var td = $('<td></td>');
    td.text(this.tracks[i].name);
    tr.append(td);
    tr.toggleClass('active',this.activeTrack==i);
    (function(i){
      tr.click((function(){
        this.track(i);
      }).bind(this));
    }).bind(this)(i);
    this.uiTable.append(tr);
  }
}
AudioWidget.prototype.track = function(track){
  this.tracksman.audio(track);
}
// e is the jQuery keydown event
AudioWidget.prototype.keydown = function(e){
  if (e.keyCode == 13 // enter
   || e.keyCode == 27 // escape
  ){
    this.hide();
    return true;
  }
  // meta + arrow is bound to volume control
  // we dont catch the arrows if used for that
  if(e.metaKey) return;

  if (e.keyCode == 38  // up arrow
  ){
    var count = this.tracks.length;
    var active = this.activeTrack;
    if(active == 0) active=count-1;
    else active--;
    this.track(active);
    return true;
  }
  if (e.keyCode == 40  // down arrow
  ){
    var count = this.tracks.length;
    var active = this.activeTrack;
    if(active == count-1) active=0;
    else active++;
    this.track(active);
    return true;
  }
}
