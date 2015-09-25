/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * torrent.js - Torrent utilities
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

var Torrent = {

  /**
   * create HTTP stream from .torrent file
   *
   * @param path { string } - local path to a .torrent file
   *                          e.g. /User/john/file.torrent
   */
  playFromFile : function(path) {

    arnold.arnoldGui.log('reading torrent file ...');
    var readTorrent = require('read-torrent');
    readTorrent(path, function (err, torrent, raw) {
      Torrent.playFromTorrentOrMagnet(raw);
    });
  },

  /**
   * create HTTP stream from .torrent file
   *
   * @param torrent { string } - torrent file content as buffer
   *                             or magnet link
   */
  playFromTorrentOrMagnet : function(magnet_link_or_buffer) {

    arnold.arnoldGui.log('initializing download ...');
    var peerflix = require('peerflix');
    arnold.mediaInfo.filepath = '/tmp/'+(new Date().getTime());
    var engine = peerflix(magnet_link_or_buffer, { port: 0, path:arnold.mediaInfo.filepath});
    engine.server.on('listening', function () {
      arnold.arnoldGui.log('stream is ready');
      player.playMRL('http://localhost:'+engine.server.address().port);
    });
    // console.log(engine.files)
    // for(var i=0 ; i<engine.files.length ; i++) {
    //   console.log(engine.files[i].name, engine.files[i].path)
    // }
  }
}
