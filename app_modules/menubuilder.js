/**
 * Arnold - advanced media center based on VLC and NW.js
 *
 * menubuilder.js - Native application menu utility
 *
 * @author Alexandre Bintz <alexandre@bintz.io>
 * 09/2015
 */

'use strict';

/**
 * MenuBuilder
 */
function MenuBuilder(gui) {

  this.gui = gui;
  this.menubar = undefined;
}

module.exports = MenuBuilder;

/**
 * MenuBuilder - Setup application menu bar
 */
MenuBuilder.prototype.initMenuBar = function() {

  this.menubar = new this.gui.Menu({ type: 'menubar' });
  this.gui.Window.get().menu = this.menubar;
}

/**
 * MenuBuilder - Create default Mac application menus
 */
MenuBuilder.prototype.createMacBuiltin = function() {

  this.menubar.createMacBuiltin('Arnold', {
    hideEdit: false,
    hideWindow: false
  });
}

/**
 * MenuBuilder - Create a menu item
 *
 * @param label     { string   } - item label
 * @param action    { function } - item action
 * @param key       { string   } - shortcut main key
 * @param modifiers { string   } - shortcut modifiers keys e.g. 'shift', 'cmd+shift', etc.
 *
 * @return { nw.gui.MenuItem }
 */
MenuBuilder.prototype.item = function(label, action, key, modifiers) {

  return new this.gui.MenuItem({
    label     : label,
    click     : action,
    key       : key,
    modifiers : modifiers,
  });
}

/**
 * MenuBuilder - Create a separator item
 *
 * @return { nw.gui.MenuItem }
 */
MenuBuilder.prototype.separator = function() {

  return new this.gui.MenuItem({ type: 'separator' });
}

/**
 * MenuBuilder - Create and add a menu to the menubar
 *
 * @param label { string } - menu label
 * @param items { array  } - menu's items { nw.gui.MenuItem }
 */
MenuBuilder.prototype.menu = function(label, items) {

  var menu = new this.gui.Menu();

  for (var i=0 ; i<items.length ; i++) {
    menu.append(items[i]);
  }

  var item = new this.gui.MenuItem({
    label   : label,
    submenu : menu,
  });

  this.menubar.append(item);
}
