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

  this.mrl        = undefined;  // media MRL as passed to VLC
  this.filepath   = undefined;  // path of the actual source file
                                // when playing local files filepath is the same as the MRL
                                // when streaming from torrent MRL is the HTTP stream
                                // while filepath is the path to the streamed file
                                // filepath might be unset e.g. for Internet streams

  this.title      = undefined;  // WebChimera.VlcMedia.title
  this.audio      = undefined;  // WebChimera.VlcAudio
  this.subtitles  = undefined;  // WebChimera.VlcSubtitles

  this.name       = undefined;  // human readable media name, something like :
                                //  Another Earth
                                //  Extant 1x01 Re-Entry
                                //  Gravity, LukHash - Falling Apart

  this.imdb_id    = undefined;  // for TV show this is the id of the show, not the episode
  this.season_nb  = undefined;  // season number starting at 1
  this.episode_nb = undefined;  // episode number in the season starting at 1

  this.os_hash    = undefined;  // OpenSubtitles file hash
}
