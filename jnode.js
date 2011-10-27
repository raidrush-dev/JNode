/*!
 * JNode: lightweight javascript/dom framework for modern browsers.
 *
 * supported browsers:
 * - Firefox 3.6+ / Seamonkey 2 / Fennec       | [X] tested (Firefox 3.6 / Seamonkey 2.0 without transitions, Fennec needs testing)
 * - Chrome / Safari 3.2+ / MobileWebkit       | [ ] tested
 * - Opera 10.5+                               | [ ] tested
 * - MSIE 8+                                   | [X] tested (MSIE 8 without transitions)
 *
 * @version   0.0.1a1
 * @copyright 2011 <murdoc@raidrush.org>
 */
 
"use strict";

var JNode = (function() {
  // private
  var EL_DIV   = document.createElement('div'), 
      EL_TABLE = document.createElement('table'),
      EL_TBODY = document.createElement('tbody'),
      EL_TR    = document.createElement('tr');
  
  // private
  var CONTAINERS = {
    'tbody':  EL_TABLE,
    'tfoot':  EL_TABLE,
    'thead':  EL_TABLE,
    'tr':     EL_TBODY,
    'th':     EL_TR,
    '*':      EL_DIV
  };

  // private
  var INSERTION = {
    before: function(element, node) {
      element.parentNode.insertBefore(node, element);
    },
    top: function(element, node) {
      element.insertBefore(node, element.firstChild);
    },
    bottom: function(element, node) {
      element.appendChild(node);
    },
    after: function(element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    },
    
    // used to generate HTML-nodes from a string
    tags: {
      TABLE:  ['<table>',                '</table>',                   1],
      TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
      TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TH:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
      SELECT: ['<select>',               '</select>',                  1],
      LI:     ['<ul>',                   '</ul>',                      1],
      DT:     ['<dl>',                   '</dl>',                      1],
      DD:     ['<dl>',                   '</dl>',                      1]
    }
  };
  
  // private
  var SLICE = Array.prototype.slice;
  
  // private
  var ANON_ID_COUNTER = 0;
  
  // private
  var STORAGE_ID_COUNTER = 10;
  
  // private
  var JSONP_CALLBACK_COUNTER = 0;
  
  // ----------------------------------------------
  
  // private
  function fragment(html) 
  {
    var name = (html.match(/\<([\S]+)/) || [0, '*'])[1].toLowerCase();

    if (!CONTAINERS[name])
      name = '*';

    CONTAINERS[name].innerHTML = html;
    var element = CONTAINERS[name].childNodes[0];

    // reset
    CONTAINERS[name].innerHTML = '';
    return element;
  }
  
  // ----------------------------------------------
  // node
  
  //@requre src/node.js
  
  // ----------------------------------------------
  // node-list
  
  // @require src/list.js
  
  // ----------------------------------------------
  // storage
  
  // @require src/storage.js
  
  // ----------------------------------------------
  // event-handling
  
  //@require src/event.js
  
  // ----------------------------------------------
  // effects
  
  //@require src/effect.js
  
  // ----------------------------------------------
  // ajax
  
  //@require src/request.js
  
  // ----------------------------------------------
  // static
  
  // private
  var RX_EL_ID   = /^(\w+)?#([\w:]+)$/,
      RX_EL_NAME = /^[a-zA-Z]+$/,
      RX_EL_FIX  = /^(?:html|body|head|title)$/i;
  
  /**
   * finds all elements matching the given css-selector and 
   * returns them as an array of JNodes
   *
   * @param   String          selector
   * @param   Element|JNode   context
   * @param   Boolean         first
   * @return  Array<JNode>
   */
  JNode.find = function find(selector, context, first) 
  {
    context = context 
      ? (context instanceof JNode)
        ? context.node : context : document;
    
    var nodes = [],
        match;
        
    // id selector
    if (selector.match(RX_EL_ID)) {
      // we have to use `document` instead of context
      match = document.getElementById(RegExp.$2);
      first = true; // override if necessary
      
      // check tagname if requested
      if (RegExp.$1 && match.nodeName.toUpperCase() != RegExp.$1.toUpperCase())
        match = null;
    }
    // fixed tag selector
    else if (selector.match(RX_EL_FIX)) {
        // html/head/body/title
        match = document[selector];
        first = true; // override if necessary
    }
    // element-tagname selector
    else if (selector.match(RX_EL_NAME)) {
      // tag-name selector
      match = context.getElementsByTagName(selector);
      
      // first?
      if (first) 
        match = match ? match[0] : null;
    }
    // css-selector
    else {
      match = context["querySelector" + (first ? "" : "All")](selector) || [];
      
      if (first && Array.isArray(match))
        match = null; // fallback used
    }
    
    if (first)
      return match ? new JNode(match) : null;
    
    if (!match.length)
      return null;
    
    for (var i = 0, l = match.length; i < l; ++i)
      nodes.push(new JNode(match[i]));
      
    return new JNode.List(nodes);
  };
  
  /**
   * checks if an element would match a css-selector
   * 
   * based on Sizzle
   * <http://sizzlejs.com/>
   *
   * @param   String    selector
   * @param   Element   element
   * @return  Boolean
   */
  (function() {
    var html    = document.documentElement,
        matches = html.matchesSelector || html.mozMatchesSelector 
               || html.webkitMatchesSelector || html.msMatchesSelector;
    
    if (!matches)
      // MSIE 8 fallback
      return JNode.match = function match(expr, node) { 
        return Array.prototype.indexOf.call(node.parentNode.querySelectorAll(expr), node) != -1; };
    
    // Check to see if it's possible to do matchesSelector
    // on a disconnected node (IE 9 fails this)
    var disconnectedMatch = !matches.call(document.createElement("div"), "div"),
        pseudoWorks       = false;

    try {
      // This should fail with an exception
      // Gecko does not error, returns false instead
      matches.call(html, "[test!='']:sizzle");
    } catch(pseudoError) {
      pseudoWorks = true;
    }
    
    var pseudoRegex = /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/;

    JNode.match = function match(expr, node) {
      // Make sure that attribute selectors are quoted
      expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
      
      try {
        if (pseudoWorks || pseudoRegex.test(expr) && !(/!=/.test(expr))) {
          var ret = matches.call(node, expr);

          // IE 9's matchesSelector returns false on disconnected nodes
          if (ret || !disconnectedMatch ||
            // As well, disconnected nodes are said to be in a document
            // fragment in IE 9, so check for that
            node.document && node.document.nodeType !== 11 ) {
            return ret;
          }
        }
      } catch(e) {}
      
      return false;
    };
  })();
  
  /**
   * wrapper/initializer function
   *
   * @param   mixed               indicator
   * @return  JList|JNode|JEvent
   */
  JNode.init = function init(indicator)
  {
    if (indicator instanceof Event)
      return new JNode.Event(indicator);
    
    if (arguments.length === 1) {
      if (indicator instanceof Element || indicator === document)
        return new JNode(indicator);
        
      return new JNode(document.getElementById(indicator));
    }
      
    var nodes = [];
    
    for (var i = 0, l = arguments.length; i < l; ++i)
      nodes.push(init(arguments[i]));
      
    return new JNode.List(nodes);
  };
  
  /**
   * executes a function when the browser is in idle
   *
   * @param   Function    func
   * @return  Number
   */
  JNode.defer = function defer(func) 
  {
    var args = SLICE.call(arguments, 1);
    
    return window.setTimeout(function() {
      func.apply(null, args);
    }, 10);
  };
  
  /**
   * for each() loop
   *
   * @param   Array|Object    object
   * @param   Function        func
   * @param   Object          context
   * @void
   */
  JNode.each = function each(object, func, context)
  {
    context = context || null;
    
    try {
      // native array
      if (Array.isArray(object))
        return object.forEach(func, context);
      
      // array-like
      if (object.length) {
        for (var i = 0, l = object.length; i < l; ++i)
          func.call(context, object[i], i, object);
          
        return;
      }
      
      // object
      var keys = Object.keys(object);
      
      for (var i = 0, k, l = keys.length; i < l; ++i)
        func.call(context, object[k = keys[i]], k, object);
    } catch (e) {
      if (e === 0)
        return;
        
      throw e;
    }
  };
  
  /**
   * noop-function
   *
   * @void
   */
  JNode.noop = function noop() {};
  
  // ----------------------------------------------
  // utilities
  
  JNode._$$ = window.$$;
  JNode._$  = window.$;
  window.$$ = JNode.find;
  window.$  = JNode.init;
  
  JNode.noConflict = function noConflict() {
    window.$$ = JNode._$$;
    window.$  = JNode._$;
    
    return {
      '$$': JNode.find,
      '$':  JNode.init
    };
  };
  
  // ----------------------------------------------
  // expose
  
  return JNode;
})();
