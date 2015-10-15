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

function SubtitlesWidget(root,tracksman,selectFile){
  this.uiRoot = $(root);
  this.uiTable = this.uiRoot.find('.subtitlesTable');
  this.tracksman = tracksman;
  this.selectFile = selectFile;
  this.searchPending = false;
  this.searchComplete = false;
  this.visible = true;
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
  this.refresh();
}
module.exports = SubtitlesWidget;

SubtitlesWidget.prototype.show = function(){
  this.uiRoot.show();
  this.visible = true;
}
SubtitlesWidget.prototype.hide = function(){
  this.highlightItem(undefined);
  this.uiRoot.hide();
  this.visible = false;
}
SubtitlesWidget.prototype.toggleVisible = function(){
  this.visible ? this.hide() : this.show();
}
SubtitlesWidget.prototype.clear = function(){
  this.uiTable.children().remove();
}
SubtitlesWidget.prototype.refresh = function(){
  var tracks = this.tracksman.subtitlesTracks;
  var activeTrack = this.tracksman.activeSubtitlesTrack;
  // save selected and highlighted items
  var selectedItem = this.items && this.items[this.selectedItemIndex];
  var highlightedItem = this.items && this.items[this.highlightedItemIndex];
  // items = tracks + actions
  this.items = [];
  for(var i=0, l=tracks.length ; i<l ; i++){
    this.items.push({
      type: 'track',
      index: i,
      track: tracks[i],
    });
  }
  for(var i=0, l=this.actions.length ; i<l ; i++){
    if(this.actions[i].action != 'search' || !this.searchComplete){
      this.items.push(this.actions[i]);
    }
    if(this.actions[i].action == 'search'){
      this.actions[i].element.toggleClass('complete',this.searchComplete);
    }
  }
  // build item list (action items are already ready)
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
SubtitlesWidget.prototype.update = function(){
  // if no item is selected, make the item that corresponds
  // to the active track the selected item
  // if no active track, select the 'disable' action
  if(this.selectedItemIndex === undefined){
    if(this.tracksman.activeSubtitlesTrack !== undefined){
      this.selectedItemIndex = this.getItemIndexForActiveTrack();
    } else {
      this.selectedItemIndex = this.getItemIndexForAction('disable');
    }
  }
  for(var i=0, l=this.items.length ; i<l ; i++){
    var element = this.items[i].element;
    if(element) {
      element.toggleClass('selected',this.selectedItemIndex == i);
      element.toggleClass('highlighted',this.highlightedItemIndex == i);
      if(this.items[i].type == 'action' && this.items[i].action == 'search'){
        element.toggleClass('loading',this.searchPending);
      }
    }
  }
}
SubtitlesWidget.prototype.getItemIndexForActiveTrack = function(){
  for(var i=0, l=this.items.length ; i<l ; i++) {
    if(this.items[i].type == 'track'
    && this.items[i].index == this.tracksman.activeSubtitlesTrack){
      return i;
    }
  }
  return undefined;
}
SubtitlesWidget.prototype.getItemIndexForItem = function(item){
  if(item){
    for(var i=0, l=this.items.length ; i<l ; i++){
      if((this.items[i].type == 'track'
      && item.type == 'track'
      && item.track == this.items[i].track
      )||(this.items[i].type == 'action'
      && item.type == 'action'
      && item.action == this.items[i].action
      )){
        return i;
      }
    }
  }
  return undefined;
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
SubtitlesWidget.prototype.initHighlightedItemIfNeeded = function(){
  if(this.highlightedItemIndex === undefined){
    if(this.selectedItemIndex !== undefined){
      this.highlightedItemIndex = this.selectedItemIndex;
    } else {
      this.highlightedItemIndex = 0;
    }
  }
}
SubtitlesWidget.prototype.highlightItem = function(index){
  this.highlightedItemIndex = index;
  this.update();
}
SubtitlesWidget.prototype.setSelectedItem = function(index){
  this.selectedItemIndex = index;
  this.update();
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
        this.tracksman.searchSubtitles('en',1,(function(found,index){
          this.searchPending = false;
          this.searchComplete = true;
          this.refresh(); // changing this.searchComplete requires a refresh
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
// e is the jQuery keydown event
SubtitlesWidget.prototype.keydown = function(e){
  if(e.keyCode == 27 // escape
  ){
    this.hide();
    return true;
  }
  if (e.keyCode == 13 // enter
  ){
    if(this.items[this.highlightedItemIndex].type != 'action'
    || this.items[this.highlightedItemIndex].action != 'load'){
      this.setSelectedItem(this.highlightedItemIndex);
    }
    this.selectItem(this.highlightedItemIndex,true);
    return true;
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
