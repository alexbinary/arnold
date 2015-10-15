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
  this.uiRoot.hide();
  this.visible = false;
}
SubtitlesWidget.prototype.toggleVisible = function(){
  this.visible ? this.hide() : this.show();
}
SubtitlesWidget.prototype.clear = function(){
  this.uiTable.children().remove();
}
// refresh internals from tracksman
SubtitlesWidget.prototype.refresh = function(){
  this.tracks = this.tracksman.subtitlesTracks;
  this.activeTrack = this.tracksman.activeSubtitlesTrack;
  // items = tracks + actions
  this.items = [];
  for(var i=0, l=this.tracks.length ; i<l ; i++){
    this.items.push({
      type: 'track',
      index: i,
      track: this.tracks[i],
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
  for(var i=0 ; i<this.items.length ; i++) {
    var element = undefined;
    if(this.items[i].type == 'track'){
      var tr = $('<tr></tr>');
      var td = $('<td></td>');
      td.text(this.items[i].track.name);
      tr.append(td);
      this.uiTable.append(tr);
      this.items[i].element = tr;
      element = tr;
    } else {
      element = this.items[i].element;
    }
    if(element){
      (function(i){
        element.off('click');
        element.click((function(){
          this.selectItem(i,true);
        }).bind(this));
      }).bind(this)(i);
    }
  }
  // selected item is the active track if defined
  if(this.activeTrack !== undefined){
    for(var i=0 ; i<this.items.length ; i++) {
      if(this.items[i].type == 'track' && this.items[i].index==this.activeTrack){
        this.selectedItem = i;
        break;
      }
    }
  }
  // clear selected item if active track is reset
  else if(this.items[this.selectedItem]
    && this.items[this.selectedItem].type == 'track'){
    this.selectedItem = undefined;
  }
  this.update();
}
// update display from highlighted item
SubtitlesWidget.prototype.update = function(){
  if(!this.items) return;
  // if no item is marked as highlighted,
  // then it is the 'disable' action
  // fallback to first item
  if(this.selectedItem === undefined){
    this.selectedItem = this.getItemIndexForAction('disable');
  }
  if(this.selectedItem === undefined){
    this.selectedItem = 0;
  }
  if(this.highlightedItem === undefined){
    this.highlightedItem = this.selectedItem;
  }
  for(var i=0 ; i<this.items.length ; i++) {
    var element = this.items[i].element;
    if(element) {
      element.toggleClass('selected',this.selectedItem == i);
      element.toggleClass('highlighted',this.highlightedItem == i);
      if(this.items[i].type == 'action' && this.items[i].action == 'search'){
        element.toggleClass('loading',this.searchPending);
      }
    }
  }
}
SubtitlesWidget.prototype.getItemIndexForAction = function(action){
  for(var i=0 ; i<this.items.length ; i++) {
    if(this.items[i].type == 'action' && this.items[i].action==action){
      return i;
    }
  }
  return undefined;
}
SubtitlesWidget.prototype.highlightItem = function(item){
  this.highlightedItem = item;
  this.update();
}
SubtitlesWidget.prototype.setSelectedItem = function(item){
  this.selectedItem = item;
  this.update();
}
SubtitlesWidget.prototype.selectItem = function(item,userInitiated){
  this.setSelectedItem(item);
  var item = this.items[item];
  if(item){
    if(item.type == 'track'){
      this.tracksman.subtitles(item.index);
      if(userInitiated) this.hide();
    } else if(item.type == 'action'){
      if(item.action == 'search'){
        this.searchPending = true;
        this.tracksman.searchSubtitles('en',1,(function(){
          this.searchPending = false;
          this.searchComplete = true;
          this.refresh();
          this.tracksman.subtitles(this.tracksman.subtitlesTracks.length-1);
          this.hide();
        }).bind(this));
      } else if(item.action == 'load'){
        this.selectFile((function(path){
          this.tracksman.addSubtitles(path);
          this.tracksman.subtitles(this.tracksman.subtitlesTracks.length-1);
          this.hide();
        }).bind(this));
      } else if(item.action == 'disable'){
        this.tracksman.subtitles(null);
        this.hide();
      }
    }
  }
}
// e is the jQuery keydown event
SubtitlesWidget.prototype.keydown = function(e){
  if(e.keyCode == 27 // escape
  ){
    this.hide();
  }
  if (e.keyCode == 13 // enter
  ){
    this.selectItem(this.highlightedItem,true);
    return true;
  }
  // meta + arrow is bound to volume control
  // we dont catch the arrows if used for that
  if(e.metaKey) return;

  if (e.keyCode == 38  // up arrow
  ){
    var count = this.items.length;
    var active = this.highlightedItem;
    if(active == 0) active=count-1;
    else active--;
    this.highlightItem(active);
    return true;
  }
  if (e.keyCode == 40  // down arrow
  ){
    var count = this.items.length;
    var active = this.highlightedItem;
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
      this.selectItem(this.getItemIndexForAction('search'));
    }
  }
}
