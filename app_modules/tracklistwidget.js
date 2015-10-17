/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * tracklistwidget.js - Audio and subtitles list widget abstraction
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var $ = require('jquery');
var EventEmitter = require('events');

function TrackListWidget(root,tracksman){
  EventEmitter.call(this);
  this.tracksman = tracksman;
  this.getUi(root);
  this.init();
  this.refresh();
}
require('util').inherits(TrackListWidget, EventEmitter);

TrackListWidget.prototype.getUi = function(root){
  this.uiRoot = $(root);
}
TrackListWidget.prototype.init = function(){
  this.visible = undefined;
}
TrackListWidget.prototype.show = function(){
  this.uiRoot.show();
  this.visible = true;
}
TrackListWidget.prototype.hide = function(){
  this.highlightItem(undefined);
  this.uiRoot.hide();
  this.visible = false;
}
TrackListWidget.prototype.toggleVisible = function(){
  this.visible ? this.hide() : this.show();
}
TrackListWidget.prototype.clear = function(){
  // abstract
}
TrackListWidget.prototype.refresh = function(){
  var activeTrack = this.getTracksmanActiveTrack();
  // save selected and highlighted items
  var selectedItem = this.items && this.items[this.selectedItemIndex];
  var highlightedItem = this.items && this.items[this.highlightedItemIndex];
  // build item list (action items are already ready)
  this.initItemList();
  this.clear();
  for(var i=0, l=this.items.length ; i<l ; i++){
    if(this.items[i].type == 'track'){
      var tr = $('<tr></tr>');
      var td = $('<td></td>');
      td.text(this.items[i].track.name);
      tr.append(td);
      this.uiTable.append(tr);
      this.items[i].element = tr;
    }
    var element = this.items[i].element;
    if(element){
      (function(i){
        element.off('click');
        element.click((function(){
          this.selectItem(i,true);
        }).bind(this));
        element.off('hover');
        element.hover((function(){
          this.highlightItem(i);
        }).bind(this),(function(){
          this.highlightItem(null);
        }).bind(this));
      }).bind(this)(i);
    }
  }
  // select item to reflect the active track if any
  if(activeTrack !== undefined){
    this.selectedItemIndex = this.getItemIndexForActiveTrack();
  } else {
    // attempt to restore previously selected item
    this.selectedItemIndex = this.getItemIndexForItem(selectedItem);
    // clear selected item if obsolete
    if(this.items[this.selectedItemIndex]
      && this.items[this.selectedItemIndex].type == 'track'){
      this.selectedItemIndex = undefined;
    }
  }
  // attempt to restore previously highlighted item
  this.highlightedItemIndex = this.getItemIndexForItem(highlightedItem);
  this.update();
}
TrackListWidget.prototype.initItemList = function(){
  var tracks = this.getTracksmanTracks();
  this.items = [];
  for(var i=0, l=tracks.length ; i<l ; i++){
    this.items.push({
      type: 'track',
      index: i,
      track: tracks[i],
    });
  }
}
TrackListWidget.prototype.update = function(){
  this.initSelectedItemIfNeeded();
  for(var i=0, l=this.items.length ; i<l ; i++){
    var element = this.items[i].element;
    if(element) {
      element.toggleClass('selected',this.selectedItemIndex == i);
      element.toggleClass('highlighted',this.highlightedItemIndex == i);
    }
  }
}
TrackListWidget.prototype.getTracksmanTracks = function(){
  // abstract
}
TrackListWidget.prototype.getTracksmanActiveTrack = function(){
  // abstract
}
TrackListWidget.prototype.getItemIndexForActiveTrack = function(){
  for(var i=0, l=this.items.length ; i<l ; i++) {
    if(this.items[i].type == 'track'
    && this.items[i].index == this.getTracksmanActiveTrack()){
      return i;
    }
  }
  return undefined;
}
TrackListWidget.prototype.compareItems = function(item1,item2){
  // abstract
}
TrackListWidget.prototype.getItemIndexForItem = function(item){
  if(item){
    for(var i=0, l=this.items.length ; i<l ; i++){
      if(this.compareItems(this.items[i],item)){
        return i;
      }
    }
  }
  return undefined;
}
TrackListWidget.prototype.initSelectedItemIfNeeded = function(){
  // if no item is selected, make the item that corresponds
  // to the active track the selected item
  if(this.selectedItemIndex === undefined){
    if(this.getTracksmanActiveTrack() !== undefined){
      this.selectedItemIndex = this.getItemIndexForActiveTrack();
    }
  }
}
TrackListWidget.prototype.initHighlightedItemIfNeeded = function(){
  if(this.highlightedItemIndex === undefined){
    if(this.selectedItemIndex !== undefined){
      this.highlightedItemIndex = this.selectedItemIndex;
    } else {
      this.highlightedItemIndex = 0;
    }
  }
}
TrackListWidget.prototype.highlightItem = function(index){
  this.highlightedItemIndex = index;
  this.update();
}
TrackListWidget.prototype.setSelectedItem = function(index){
  this.selectedItemIndex = index;
  this.update();
}
TrackListWidget.prototype.selectItem = function(index,userInitiated){
  // abstract
}
// e is the jQuery keydown event
TrackListWidget.prototype.keydown = function(e){
  if(e.keyCode == 27 // escape
  ){
    this.hide();
    return true;
  }
  if (e.keyCode == 13 // enter
  ){
    return this.keydownEnter();
  }
  // meta + arrow is bound to volume control
  // we dont catch the arrows if used for that
  if(e.metaKey) return false;

  if (e.keyCode == 38  // up arrow
  ){
    this.initHighlightedItemIfNeeded();
    var count = this.items.length;
    var active = this.highlightedItemIndex;
    if(active == 0) active=count-1;
    else active--;
    this.highlightItem(active);
    return true;
  }
  if (e.keyCode == 40  // down arrow
  ){
    this.initHighlightedItemIfNeeded();
    var count = this.items.length;
    var active = this.highlightedItemIndex;
    if(active == count-1) active=0;
    else active++;
    this.highlightItem(active);
    return true;
  }
}
TrackListWidget.prototype.keydownEnter = function(e){
  this.selectItem(this.highlightedItemIndex,true);
  return true;
}

module.exports = TrackListWidget;
