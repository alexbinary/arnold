/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * torrent.js - Torrent utilities
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

var util         = require('util');
var EventEmitter = require('events');

/**
 * TorrentEngine
 * inherits EventEmitter
 *
 * Create engine for given torrent
 *
 * @param torrent { string } - path to .torrent or magnet link
 * @param opts    { object } - peerflix/torrent-stream options
 */
function TorrentEngine(torrent, opts) {
  EventEmitter.call(this);

  this.torrent = torrent;
  this.streamUrl = undefined;
  this.state = 0; // stopped
  this.paused = false;
  this.status = {};
  this.files = [];
  this.filesDirty = true;
  this.selectedFiles = [];

  var torrentData = null;
  if(this.torrent.startsWith('magnet:?')) torrentData = this.torrent;
  else torrentData = require('fs').readFileSync(this.torrent);
  this.engine = require('peerflix')(torrentData, opts);
  this.engine.on('verifying', (function() {
    this.state = 1; // verifying
    this.emit('stateChanged');
  }).bind(this));
  this.engine.on('ready', (function() {
    this.engine.server.index.deselect();
    if(!this.files || !this.files.length) this.initFiles();
    this.state = 2; // ready
    this.emit('stateChanged');
  }).bind(this));
  this.engine.server.on('listening', (function () {
    this.streamUrl = 'http://localhost:'+this.engine.server.address().port;
    this.emit('stateChanged');
  }).bind(this));
  this.engine.on('verify', (function(pieceIndex){
    if(!this.files || !this.files.length) this.initFiles();
    var pieceByteOffset = pieceIndex*this.engine.torrent.pieceLength;
    var pieceByteLength = pieceIndex == this.engine.torrent.pieces.length-1
      ? this.engine.torrent.lastPieceLength
      : this.engine.torrent.pieceLength;
    for(var i=0 ; i<this.engine.files.length ; i++) {
      var fileByteOffset = this.engine.files[i].offset;
      var fileByteLength = this.engine.files[i].length;
      if(pieceByteOffset >= fileByteOffset
      && pieceByteOffset < (fileByteOffset+fileByteLength)) {
        var e = fileByteOffset+fileByteLength - pieceByteOffset;
        if(e >= pieceByteLength) {
          this.files[i].dldLength += pieceByteLength;
          break;
        } else {
          this.files[i].dldLength += e;
          pieceByteLength -= e;
          pieceByteOffset += e;
        }
      }
    }
    this.filesDirty = true;
    this.emit('stateChanged');
  }).bind(this));
}
util.inherits(TorrentEngine, EventEmitter);

module.exports = TorrentEngine;

TorrentEngine.prototype.selectFile = function (index) {
  this.selectedFiles.push(index);
  this.filesDirty = true;
  this.applySelectedFiles();
}

TorrentEngine.prototype.deselectFile = function (index) {
  this.selectedFiles = this.selectedFiles.filter(function(i){return i!=index});
  this.filesDirty = true;
  this.applySelectedFiles();
}

TorrentEngine.prototype.setSelectedFiles = function (indexes) {
  this.selectedFiles = indexes;
  this.filesDirty = true;
  this.applySelectedFiles();
}

TorrentEngine.prototype.pause = function () {
  this.engine.files.forEach(function(file, index){file.deselect()});
  this.paused = true;
  this.emit('stateChanged');
}

TorrentEngine.prototype.start = function () {
  this.applySelectedFiles();
}

TorrentEngine.prototype.applySelectedFiles = function () {
  this.engine.files.forEach(function(file, index) {
    this.selectedFiles.indexOf(index)!==-1 ? file.select() : file.deselect();
  },this);
  this.paused = false;
  this.emit('stateChanged');
}

TorrentEngine.prototype.destroy = function () {
  this.engine.server.close();
  this.engine.destroy();
  this.torrent = undefined;
  this.streamUrl = undefined;
  this.state = 3; // destroyed
  this.paused = false;
  this.status = {};
  this.files = [];
  this.filesDirty = true;
  this.selectedFiles = [];
  this.emit('stateChanged');
}

TorrentEngine.prototype.computeHash = function (index,cb) {
  require('../node_modules_hacked/os-torrent-hash')
  .computeHash(this.torrent, this.engine, index)
  .then((function (res) {
    this.files[index].osHash = res.movieHash;
    this.filesDirty = true;
    this.emit('stateChanged');
    if(typeof cb=='function')cb(res.movieHash);
  }).bind(this))
  .catch(function (error) {
  })
  .done();
}

TorrentEngine.prototype.getStatus = function () {
  this.refreshStatus();
  return this.status;
}

TorrentEngine.prototype.getFiles = function () {
  if(this.filesDirty) this.refreshFiles();
  return this.files;
}

TorrentEngine.prototype.refreshStatus = function () {
  this.status = {
    stateCode  : this.state,
    stateString: this.state==2 && this.paused ? 'paused' : ['stopped','verifying','ready','destroyed'][this.state],
    streamUrl  : this.streamUrl,
    downSession: this.engine && this.engine.swarm ? this.engine.swarm.downloaded : 0,
    upSession  : this.engine && this.engine.swarm ? this.engine.swarm.uploaded : 0,
    downTotal  : this.files.reduce(function(t,f){return t+f.dldLength},0),
    downSpeed  : this.engine && this.engine.swarm ? this.engine.swarm.downloadSpeed() : 0,
    upSpeed    : this.engine && this.engine.swarm ? this.engine.swarm.uploadSpeed() : 0,
    totalPeers : this.engine && this.engine.swarm && this.engine.swarm.wires ? this.engine.swarm.wires.length : 0,
    activePeers: this.engine && this.engine.swarm && this.engine.swarm.wires ? this.engine.swarm.wires.filter(function(w){return !w.peerChoking}).length : 0,
  };
}

TorrentEngine.prototype.refreshFiles = function () {
  this.engine.files.forEach(function(file, index) {
    var f = this.files[index] || {};
    f.streamUrl = this.streamUrl ? this.streamUrl+'/'+index : undefined
    f.selected  = this.selectedFiles.indexOf(index) != -1;
    f.progress  = Math.round(f.dldLength/f.totalLength*100*100)/100; // round to 0.01%
    this.files[index] = f;
  },this);
}

TorrentEngine.prototype.initFiles = function () {
  this.files = [];
  this.engine.files.forEach(function(file, index) {
    var f = this.files[index] || {};
    f.name         = file.name;
    f.path         = file.path;
    f.absolutePath = this.engine ? this.engine.path+'/'+file.path : undefined;
    f.totalLength  = file.length;
    f.dldLength    = f.dldLength || 0;
    this.files[index] = f;
  },this);
}
