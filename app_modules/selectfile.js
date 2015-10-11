/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * selectfile.js - Utility to prompt a file picker
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

module.exports = function($){// $ is the jQuery function
  return function selectFile(cb) {
    var input = $('<input type="file">');
    input.one('change',function(){
      if(require('is-callable')(cb)) cb(input.val());
    });
    input.click();
  };
};
