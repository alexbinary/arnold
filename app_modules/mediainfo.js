/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * mediainfo.js - General container for data related to a media
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * MediaInfo
 */
function MediaInfo() {

  // .uri is what the user intended to play, e.g. :
  // - a local path to a media file,
  // - a local path to a stream file,
  // - a local path to a .torrent file,
  // - a magnet link,
  // - a HTTP URL to a file or stream,
  // - etc.
  this.uri = undefined;

  // .mrl is what VLC is actually playing.
  // For local media files or URLs this is the same as .uri.
  // When streaming from torrent this is the HTTP URL of the stream.
  this.mrl = undefined;

  // .filepath is the local path to the actual source file.
  // For local media files this is the same as .uri and .mrl.
  // When streaming from torrent this is the path to the file being streamed.
  // This is unset when playing from a URL.
  this.filepath   = undefined;

  // .filename is just the file name component of filepath
  this.filename   = undefined;

  this.imdb_id    = undefined;  // for TV shows this is the id of the show, not the episode
  this.season_nb  = undefined;  // for "Castle 8x01" this is "8"
  this.episode_nb = undefined;  // for "Castle 8x01" this is "1"

  this.os_hash    = undefined;  // OpenSubtitles.org file hash
}

module.exports = MediaInfo;
