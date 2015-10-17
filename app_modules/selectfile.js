/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * selectfile.js - Utility to prompt a file picker
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

module.exports = function($){ // $ is the jQuery function
  return function selectFile(){
    var cb = undefined, fi = [];
    [arguments[0],arguments[1]].forEach(function(arg){
      if(typeof arg=='string'&&!fi.length)      fi.push(arg);
      else if(Array.isArray(arg)&&!fi.length)   fi = arg;
      else if(require('is-callable')(arg)&&!cb) cb = arg;
    });
    $('<input type="file" accept="'+fi.join(',')+'">')
    .one('change',function(){if(cb)cb(this.value);})
    .click();
  };
};
