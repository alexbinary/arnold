/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * throttleevent.js - throttle DOM event using requestAnimationFrame
 *
 * adapted from
 * https://developer.mozilla.org/en-US/docs/Web/Events/resize#requestAnimationFrame_customEvent
 * CC-BY-SA 2.5. Mozilla Contributors
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 10/2015
 */

'use strict';

module.exports = function(type, name, obj){
  var obj = obj || window;
  var running = false;
  var func = function() {
    if (running) { return; }
    running = true;
    window.requestAnimationFrame(function() {
      obj.dispatchEvent(new window.Event(name));
      running = false;
    });
  };
  obj.addEventListener(type, func);
};
