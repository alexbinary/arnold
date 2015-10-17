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
var TrackListWidget = require('../app_modules/tracklistwidget');

function AudioWidget(root,tracksman){
  TrackListWidget.call(this,root,tracksman);
}
require('util').inherits(AudioWidget, TrackListWidget);

AudioWidget.prototype.getUi = function(root){
  TrackListWidget.prototype.getUi.call(this,root);
  this.uiTable = this.uiRoot.find('.audioTable');
}
AudioWidget.prototype.init = function(){
  this.tracksman.on('audio',this.refresh.bind(this));
}
AudioWidget.prototype.clear = function(){
  this.uiTable.children().remove();
}
AudioWidget.prototype.getTracksmanTracks = function(){
  return this.tracksman.audioTracks;
}
AudioWidget.prototype.getTracksmanActiveTrack = function(){
  return this.tracksman.activeAudioTrack;
}
AudioWidget.prototype.compareItems = function(item1,item2){
  if(item1.type == 'track'
  && item2.type == 'track'
  && item2.track == item1.track
  ){
    return true;
  }
  return false;
}
AudioWidget.prototype.selectItem = function(index,userInitiated){
  var item = this.items[index];
  if(item){
    if(item.type == 'track'){
      this.tracksman.audio(item.index);
      if(userInitiated) this.hide();
    }
  }
}

module.exports = AudioWidget;
