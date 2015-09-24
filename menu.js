/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * menu.js - GUI Menu utility
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

var Menu = {

  /**
   * Create application menu bar
   */
  createAppMenuBar : function() {

    var gui = require('nw.gui');

    var menubar = undefined;
    initMenuBar();

    menu('View', [

      item('Fullscreen', function () {
        gui.Window.get().toggleFullscreen();
      }),

      item('Kiosk', function () {
        gui.Window.get().toggleKioskMode();
      }),

      separator(),

      item('Open dev tools', function () {
        gui.Window.get().showDevTools();
      }),

      item('Reload', function () {
        reload();
      }),
    ]);

    menu('Play', [

      item('Play/Pause', function () {
        player.vlc.togglePause();
      }),

      item('Stop', function () {
        player.vlc.stop();
      }),

      separator(),

      item('Jump forward 1s', function () {
        player.vlc.time = player.vlc.time + 1000*1;
      },
        String.fromCharCode(29), // arrow right
        'shift'
      ),

      item('Jump forward 10s', function () {
        player.vlc.time = player.vlc.time + 1000*10;
      },
        String.fromCharCode(29), // arrow right
        'alt'
      ),

      item('Jump forward 1min', function () {
        player.vlc.time = player.vlc.time + 1000*60;
      },
        String.fromCharCode(29), // arrow right
        'cmd'
      ),

      item('Jump backward 1s', function () {
        player.vlc.time = player.vlc.time - 1000*1;
      },
        String.fromCharCode(28), // arrow left
        'shift'
      ),

      item('Jump backward 10s', function () {
        player.vlc.time = player.vlc.time - 1000*10;
      },
        String.fromCharCode(28), // arrow left
        'alt'
      ),

      item('Jump backward 1min', function () {
        player.vlc.time = player.vlc.time - 1000*60;
      },
        String.fromCharCode(28), // arrow left
        'cmd'
      ),
    ]);

    /**
     * Create and setup menubar
     */
    function initMenuBar() {

      menubar = new gui.Menu({ type: 'menubar' });
      gui.Window.get().menu = menubar;

      menubar.createMacBuiltin('Arnold',{
        hideEdit: false,
        hideWindow: false
      });
    }

    /**
     * Create menu item
     */
    function item(label, action, key, modifiers) {

      return new gui.MenuItem({
        label     : label,
        click     : action,
        key       : key,
        modifiers : modifiers,
      });
    }

    /**
     * Create separator
     */
    function separator() {

      return new gui.MenuItem({ type: 'separator' });
    }

    /**
     * Create menu
     */
    function menu(label, items) {

      var menu = new gui.Menu();

      for(var i=0 ; i<items.length ; i++) {
        menu.append(items[i]);
      }

      var item = new gui.MenuItem({
        label   : label,
        submenu : menu,
      });

      menubar.append(item);
    }
  }
}
