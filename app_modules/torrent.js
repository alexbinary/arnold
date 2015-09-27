/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * torrent.js - Torrent utilities
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * TorrentUtils
 */
function TorrentUtils() {
}

/**
 * TorrentUtils - create HTTP stream from .torrent file or magnet link
 *
 * @param source   { mixed    } - { string } local path to a .torrent file
 *                              - { string } magnet link as a string
 *                              - { buffer } .torrent raw file content
 * @param callback { function } - { Error  } - error
 *                              - { object } - stream data
 *                                  • {string } path of the file being streamed
 *                                  • {string } url of the stream
 */
TorrentUtils.prototype.createStreamFromTorrent = function(source, callback) {

  var createStream = function(magnet_link_or_buffer) {

    var filepath = '/tmp/'+(new Date().getTime());

    var engine = require('peerflix')(magnet_link_or_buffer, {
      port: 0,
      path: filepath,
    });
    engine.server.on('listening', function () {
      callback(null, {
        url      : 'http://localhost:'+engine.server.address().port,
        filepath : filepath,
      });
    });
  };

  if(typeof source == 'string' && !(new RegExp('^magnet')).test(source)) {

    require('fs').readFile(source, function (err, data) {
      if(err) callback(err);
      else createStream(data);
    });

  } else {
    createStream(source);
  }

  // console.log(engine.files)
  // for(var i=0 ; i<engine.files.length ; i++) {
  //   console.log(engine.files[i].name, engine.files[i].path)
  // }
}
