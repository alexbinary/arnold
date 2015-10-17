/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * subtitles.js - Subtitles manager widget
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var $ = require('jquery');
var TrackListWidget = require('../app_modules/tracklistwidget');

function SubtitlesWidget(root,tracksman,selectFile){
  TrackListWidget.call(this,root,tracksman);
  this.selectFile = selectFile;
}
require('util').inherits(SubtitlesWidget, TrackListWidget);

SubtitlesWidget.prototype.getUi = function(root){
  TrackListWidget.prototype.getUi.call(this,root);
  this.uiTable = this.uiRoot.find('.subtitlesTable');
}
SubtitlesWidget.prototype.init = function(){
  this.searchPending = false;
  this.searchComplete = false;
  this.actions = [
    { type: 'action',
      action: 'search',
      element: this.uiRoot.find('.subtitlesSearch'),
    },
    { type: 'action',
      action: 'load',
      element: this.uiRoot.find('.subtitlesLoad'),
    },
    { type: 'action',
      action: 'disable',
      element: this.uiRoot.find('.subtitlesDisable'),
    }
  ];
  this.tracksman.on('subtitles',this.refresh.bind(this));
}
SubtitlesWidget.prototype.clear = function(){
  this.uiTable.children().remove();
}
SubtitlesWidget.prototype.initItemList = function(){
  TrackListWidget.prototype.initItemList.call(this);
  for(var i=0, l=this.actions.length ; i<l ; i++){
    if(this.actions[i].action != 'search' || !this.searchComplete){
      this.items.push(this.actions[i]);
    }
    if(this.actions[i].action == 'search'){
      this.actions[i].element.toggleClass('complete',this.searchComplete);
    }
  }
}
SubtitlesWidget.prototype.update = function(){
  TrackListWidget.prototype.update.call(this);
  var index = this.getItemIndexForAction('search');
  if(this.items[index] && this.items[index].element){
    this.items[index].element.toggleClass('loading',this.searchPending);
  }
}
SubtitlesWidget.prototype.getTracksmanTracks = function(){
  return this.tracksman.subtitlesTracks;
}
SubtitlesWidget.prototype.getTracksmanActiveTrack = function(){
  return this.tracksman.activeSubtitlesTrack;
}
SubtitlesWidget.prototype.compareItems = function(item1,item2){
  if((item1.type == 'track'
  && item2.type == 'track'
  && item2.track == item1.track
  )||(item1.type == 'action'
  && item2.type == 'action'
  && item2.action == item1.action
  )){
    return true;
  }
  return false;
}
SubtitlesWidget.prototype.initSelectedItemIfNeeded = function(){
  // if no active track, select the 'disable' action
  TrackListWidget.prototype.initSelectedItemIfNeeded.call(this);
  if(this.selectedItemIndex === undefined){
    this.selectedItemIndex = this.getItemIndexForAction('disable');
  }
}
SubtitlesWidget.prototype.getItemIndexForAction = function(action){
  for(var i=0 ; i<this.items.length ; i++) {
    if(this.items[i].type == 'action'
    && this.items[i].action == action){
      return i;
    }
  }
  return undefined;
}
SubtitlesWidget.prototype.selectItem = function(index,userInitiated){
  var item = this.items[index];
  if(item){
    if(item.type == 'track'){
      this.tracksman.subtitles(item.index);
      if(userInitiated) this.hide();
    } else if(item.type == 'action'){
      if(item.action == 'search'){
        if(userInitiated) this.hide();
        this.searchPending = true;
        this.update();
        this.emit('loading',true);
        this.tracksman.searchSubtitles('en',1,(function(found,index){
          this.searchPending = false;
          this.searchComplete = true;
          this.refresh(); // changing this.searchComplete requires a refresh
          this.emit('loading',false);
          if(found) this.tracksman.subtitles(index);
        }).bind(this));
      } else if(item.action == 'load'){
        this.selectFile((function(path){
          if(userInitiated) this.hide();
          var index = this.tracksman.addSubtitles(path);
          this.tracksman.subtitles(index);
        }).bind(this));
      } else if(item.action == 'disable'){
        if(userInitiated) this.hide();
        this.tracksman.subtitles(null);
      }
    }
  }
}
SubtitlesWidget.prototype.keydownEnter = function(e){
  if(this.items[this.highlightedItemIndex].type != 'action'
  || this.items[this.highlightedItemIndex].action != 'load'){
    this.setSelectedItem(this.highlightedItemIndex);
  }
  this.selectItem(this.highlightedItemIndex,true);
  return true;
}
SubtitlesWidget.prototype.toggleSubtitles = function(){
  if(this.tracksman.activeSubtitlesTrack === undefined) this.enableSubtitles();
  else this.disableSubtitles();
}
SubtitlesWidget.prototype.disableSubtitles = function(){
  this.lastSubtitlesTrack = this.tracksman.activeSubtitlesTrack;
  this.tracksman.subtitles(null);
}
SubtitlesWidget.prototype.enableSubtitles = function(){
  if(this.lastSubtitlesTrack !== undefined) {
    this.tracksman.subtitles(this.lastSubtitlesTrack);
  } else {
    if(this.tracksman.subtitles('en') === undefined){
      var index = this.getItemIndexForAction('search');
      this.setSelectedItem(index);
      this.selectItem(index);
    }
  }
}

module.exports = SubtitlesWidget;
