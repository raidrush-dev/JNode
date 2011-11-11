/*!
 * JNode: Leichtgewicht JavaScript/DOM Framework für moderne Browser - Version 0.0.1a3
 * Copyright 2011 murdoc <murdoc@raidrush.org>
 *
 * This library is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 */
 
"use strict";

/*!
 * Die hier verwendeten Funktionen ("Polyfills") wurden überwiegend übernommen von:
 * https://developer.mozilla.org/en/JavaScript/Reference/
 */
 
(function() {
  if (typeof Function.prototype.bind == "function")
    return;
  
  function polyfill(object, methods) 
  {
    for (var i in methods)
      if ((i in methods) && typeof object[i] === "undefined")
        object[i] = methods[i];
  }
  
  polyfill(Object, {
    keys: function keys(o) 
    {
      if (o !== Object(o))  
        throw new TypeError('Object.keys called on non-object');  
      var ret=[],p;  
      for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);  
      return ret;  
    }
  });
  
  polyfill(Array, {
    isArray: function isArray(object) 
    {
      return object instanceof Array;
    }
  });
  
  polyfill(Array.prototype, {
    forEach: function forEach(func, context) 
    {
      for (var i = 0, l = this.length >>> 0; i < l; ++i)
        func.call(context || null, this[i], i, this);
    },
    
    indexOf: function indexOf(val) 
    {
      for (var i = 0, l = this.length >>> 0; i < l; ++i)
        if (val === this[i])
          return i;
          
      return -1;
    },
    
    reduce: function reduce()
    {
      if(this === void 0 || this === null) throw new TypeError();
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator;
      if(typeof fun != 'function') throw new TypeError();
      if(len == 0 && arguments.length == 1) throw new TypeError();

      if(arguments.length >= 2)
       accumulator = arguments[1];
      else
        do{
          if(k in t){
            accumulator = t[k++];
            break;
          }
          if(++k >= len) throw new TypeError();
        } while (true);

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t);
        k++;
      }
      return accumulator;
    },
    
    every: function every(fun)
    {
      if (this === void 0 || this === null)  
        throw new TypeError();  
    
      var t = Object(this);  
      var len = t.length >>> 0;  
      if (typeof fun !== "function")  
        throw new TypeError();  
    
      var thisp = arguments[1];  
      for (var i = 0; i < len; i++)  
      {  
        if (i in t && !fun.call(thisp, t[i], i, t))  
          return false;  
      }  
    
      return true;  
    }
  });
  
  polyfill(Function.prototype, {
    bind: function bind(oThis)
    {
      if (typeof this !== "function") {
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
      }  
    
      var fSlice = Array.prototype.slice,  
          aArgs = fSlice.call(arguments, 1),   
          fToBind = this,
          fNOP = function () {},
          fBound = function () {  
            return fToBind.apply(this instanceof fNOP  
                                   ? this  
                                   : oThis || window,  
                                 aArgs.concat(fSlice.call(arguments)));  
          };  
    
      fNOP.prototype = this.prototype;  
      fBound.prototype = new fNOP();  
    
      return fBound;  
    }
  });
})();

var JNode = (function() {
  var EL_DIV = document.createElement('div');
  
  var CONTAINERS = {
    'tbody':  'table',
    'tfoot':  'table',
    'thead':  'table',
    'tr':     'tbody',
    'th':     'tr',
    'td':     'tr',
    '*':      'div'
  };

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
  
  var SLICE = Array.prototype.slice;
  
  var EMPTY_ARRAY = [];
  
  var ANON_ID_COUNTER = 0;
  
  var STORAGE_ID_COUNTER = 10;
  
  function fragment(html) 
  {
    var name = ((html = html.trim()).match(/^\<([^\s>]+)/) || [0, '*'])[1].toLowerCase();
    
    if (!CONTAINERS[name])
      name = '*';

    var parent = document.createElement(CONTAINERS[name]);
    parent.innerHTML = html;
    
    if (parent.firstChild && parent.firstChild.nextSibling)
      return parent;
      
    var element = parent.childNodes[0].cloneNode(true);
    
    parent = null;
    return element;
  }
  
  function JNode(tag, attr) 
  {   
    this.constructor = JNode;
    
    this.node = (tag instanceof Node || tag === document)
      ? tag : (tag instanceof JNode)
        ? tag.node : (tag.substr(0, 1) !== '<')
          ? document.createElement(tag) : fragment(tag);
    
    if (this.hook) this.hook();
    
    this._classList();
    
    if (attr) this.attr(attr);
  }

  JNode.prototype = {
    _classList: function _classList() {
      this.classList = this.prop('classList');
    },
    
    removeClass: function removeClass(name)
    {
      if (name instanceof RegExp) {
        var klass = [];
        
        JNode.each(String(this.prop('className')).split(" "), 
          function(c) {
            if (!c.match(name))
              klass.push(c);
          }
        );        
        
        this.prop('className', klass.join(" "));        
        return this;
      }
      
      this.classList.remove(name);
      return this;
    },
    
    addClass: function addClass(name)
    {
      this.classList.add(name);
      return this;
    },
    
    setClass: function setClass(name) 
    {
      this.prop('className', name);
      return this;
    },
    
    hasClass: function hasClass(name)
    {
      return this.classList.contains(name);
    },
    
    toggleClass: function toggleClass(name)
    {
      this.classList.toggle(name);
      return this;
    },
    
    defer: function defer() 
    {
      var args = SLICE.call(arguments, 0),
          call = args.shift();
          
      JNode.defer(function() { this[call].apply(this, args); }.bind(this));
      return this;
    },
    
    attr: function attr(needle, value) 
    {
      if (arguments.length === 2) {
        if (value === null) {
          this.node.removeAttribute(needle);
          return this;
        }
        
        this.node.setAttribute(needle, value);
        return this;
      }
      
      if (typeof needle == "string")
        return this.node.getAttribute(needle);
        
      JNode.each(needle, function(v, k) {
        this.node.setAttribute(k, v);
      }, this);
      
      return this;
    },
    
    style: function style(needle, value) 
    {
      if (arguments.length === 2) {
        if (value === null || value === "") {
          this.node.style.removeProperty(needle);
          return this;
        }
        
        this.node.style.setProperty(needle, value, "");
        return this;
      }
      
      if (typeof needle == "string") {
        if (needle.indexOf(":") > -1) {
          this.node.style.cssText += ';' + needle;
          return this;
        }
        
        var value;
        
        if (!!(value = this.node.style.getPropertyValue(needle)))
          return value;
        
        return document.defaultView
          .getComputedStyle(this.node, null)
          .getPropertyValue(needle);
      }
      
      JNode.each(needle, function(v, k) { this.style(k, v); }, this);
      return this;
    },
    
    hide: function hide()
    {
      return this.style("display:none;");
    },
    
    show: function show()
    {
      if (this.style("display") == "none")  
        return this.style("display", "");
        
      return this;
    }, 
    
    dim: function dim() 
    {
      var props = [this.prop('offsetWidth'), this.prop('offsetHeight')];     
      
      if (this.style("display") === "none") {
        var orig = {
          visibility: this.style("visibility"),
          position:   this.style("position")
        };
        
        var tmp = new JNode(this.node.nodeName),
            dsp = tmp.style("display");
            
        tmp = null;
        var styles = "visibility:hidden;display:" + dsp;
        
        if (["absolute", "fixed"].indexOf(orig.position) == -1)
          styles += ";position:absolute";
          
        this.style(styles);
        props = [this.prop('offsetWidth'), this.prop('offsetHeight')];
        
        this.style(orig);
      }
      
      return JNode.merge(props, {
        width:  props[0] - (this.style("border-left-width") || 0 
          + this.style("border-right-width") || 0),
          
        height: props[1] - (this.style("border-top-width") || 0 
          + this.style("border-bottom-width") || 0)
      });
    },
    
    width: function width()
    {
      var width;
      
      if (this.node.style.width && (width = parseInt(this.node.style.width)))
        return width;
        
      return this.dim().width;
    },
    
    height: function height()
    {
      var height;
      
      if (this.node.style.height && (height = parseInt(this.node.style.height)))
        return height;
        
      return this.dim().height;
    },
    
    data: function data(needle, value) 
    {
      if (arguments.length === 2) {
        this.node.dataset[needle] = value;
        return this;
      }
      
      return this.node.dataset[needle];
    },
    
    select: function select(selector) 
    {
      return JNode.find(selector, this.node);
    },
    
    prop: function prop(needle, value) 
    {
      if (arguments.length === 2) {
        this.node[needle] = value;
        return this;
      }
      
      return this.node[needle];
    },
    
    identify: function identify() 
    {
      var id;

      if ((id = this.attr("id")))
        return id;
        
      do {
        id = '_anonymus_element_' + (ANON_ID_COUNTER++);
      } while (document.getElementById(id));
      
      this.attr("id", id);
      return id;
    },
    
    wrap: function wrap(wrapper)
    {
      if (!(wrapper instanceof JNode))
        wrapper = new JNode(wrapper);
      
      if (this.node.parentNode) 
        this.node.parentNode.replaceChild(wrapper.node, this.node);
        
      wrapper.node.appendChild(this.node);
      
      return wrapper;
    },
    
    remove: function remove()
    {
      this.purge().node.parentNode.removeChild(this.node);
      return this;
    },
    
    childs: function childs(all) 
    { 
      if (all)
        return JNode.find("*", this.node);
      
      var nodes = [], node = this.node.firstElementChild;
        
      while (node) {
        nodes.push(new JNode(node));  
        node = node.nextElementSibling;
      }
        
      return new JNode.List(nodes);
    },
    
    first: function first(selector) 
    {
      return JNode.find(selector || '*', this.node, true);
    },
    
    match: function match(selector)
    {
      return JNode.match(selector, this.node);
    },
    
    parent: function parent()
    {
      return this.node.parentNode ? new JNode(this.node.parentNode) : this;
    },
    
    up: function up(selector) 
    {
      if (arguments.length === 0) 
        return this.parent();
      
      if (typeof selector == "number") {
        var p = this.node;
        
        while (selector-- && p.parentNode)
          p = p.parentNode;
          
        return new JNode(p);
      }
      
      var p = this.node.parentNode;
      
      while (p && p.nodeName && !JNode.match(selector, p))
        p = p.parentNode;
      
      return p ? new JNode(p) : null;
    },
    
    down: function down(selector, index) {
      if (arguments.length === 0)
        return this.first();
        
      if (!(index && --index))
        return JNode.find(selector, this.node, true);
        
      var childs = this.node.querySelectorAll(selector);
      return childs && childs[index] ? new JNode(childs[index]) : null;
    },
    
    next: function next(selector) {      
      var nodes  = this.parent().childs(),
          length = nodes.length;
      
      for (var i = 0; i < length; ++i) {
        if (nodes[i].node === this.node) {
          ++i;
          break;
        }
      }
      
      if (arguments.length === 0 || !selector)
        return nodes[i];
        
      if (typeof selector === "number")
        return nodes[i + selector];
      
      for (; i < length; ++i)
        if (nodes[i].match(selector))
          return nodes[i];
          
      return null;
    },
    
    find: function find(selector)
    {
      if (!selector)
        return this;
        
      var node = this.node;
      
      while (node) {
        if (JNode.match(selector, node))
          return new JNode(node);
          
        node = node.parentNode;
      }
      
      return null;
    },
    
    insert: function insert(data, pos)
    {
      pos = (pos || 'bottom').toLowerCase();
      
      if (data instanceof JNode)
        data = data.node;
      else if (!(data instanceof Node) && !Array.isArray(data))
        return this.insertText(data, pos);
        
      return this.insertNode(data, pos);    
    },
    
    insertText: function(content, pos) 
    {
      var div = EL_DIV, mth;
        
      if (pos === 'before' || pos === 'after')
        mth = INSERTION.tags[(this.node.parentNode || this.node).nodeName.toUpperCase()];
      else
        mth = INSERTION.tags[this.node.nodeName.toUpperCase()];
     
      if (!!mth) {
        div.innerHTML = '&nbsp;' + t[0] + content + t[1];
        div.removeChild(div.firstChild);
        
        for (var i = t[2]; i--; )
          div = div.firstChild;
      } else {
        div = div.cloneNode(true);
        div.innerHTML = data;
      }
      
      EL_DIV.innerHTML = '';
      
      var nodes = SLICE.call(div.childNodes, 0);
      return this.insertNode(nodes, pos);
    },
    
    insertNode: function(content, pos) 
    {
      var mth = INSERTION[pos] || INSERTION['bottom'];
      
      if (!Array.isArray(content)) {
        mth(this.node, content);
        return this;
      }
      
      if (pos === 'top' || pos === 'after') 
        content.reverse();
      
      for (var i = 0, l = content.length; i < l; ++i) { 
        var node = content[i];
        
        if (node instanceof JNode)
          node = node.node;
          
        mth(this.node, node);
      }
      
      return this;
    },
    
    update: function update(content)
    { 
      this.childs(true).invoke('purge');
      
      if (content instanceof JNode)
        content = content.node;
      
      if (content instanceof Element) {
        this.node.innerHTML = '';
        return this.insert(content);
      }
      
      this.node.innerHTML = content;
      return this;
    },
    
    append: function append(element)
    {
      var node = this.node;
      
      if (node.parentNode)
        node = this.clone(true, true).node;
      
      if (element instanceof JNode)
        element = element.node;
        
      element.appendChild(node);
      return this;
    },
    
    clone: function clone(deep, removeId)
    {
      var c = new JNode(this.node.cloneNode(!!deep));
      
      if (removeId && c.attr("id"))
        c.attr("id", null);
        
      return c;
    }
  };
  
  (function() {
    function convertPosition(pos) 
    {
      switch ((pos || 'bottom').toLowerCase()) {
        case 'before':
          return 'beforebegin';
          
        case 'top':
          return 'afterbegin';
          
        case 'after':
          return 'afterend';
          
        default:
          return 'beforeend';
      }
    }
    
    if (typeof EL_DIV.insertAdjacentHTML === "function") {
      JNode.prototype.insertText = function insertText(content, pos) 
      {
        this.node.insertAdjacentHTML(convertPosition(pos), content);
        return this;
      };
    }
    
    if (typeof EL_DIV.insertAdjacentElement == "function") {
      JNode.prototype.insertNode = function insertNode(content, pos) 
      {
        this.node.insertAdjacentElement(convertPosition(pos), content);
        return this;
      };
    }
  })();
  
  if (typeof EL_DIV.dataset === "undefined") {
    JNode.prototype.data = function data(needle, value) 
    {
      if (arguments.length === 2) {
        this.attr("data-" + needle, value);
        return this;
      }
      
      return this.attr("data-" + needle);
    };
  }
  
  if (typeof EL_DIV.classList === "undefined") {
    JNode.prototype._classList = function _classList()
    {
      var node = this.node, self = this;
      
      function ts(c) { return c ? c.toString() : ""; }
      
      this.classList = {
        add:      function(name) { node.className += " " + name; },
        remove:   function(name) { node.className = ts(node.className).replace(new RegExp("\\b" + name + "\\b", "g"), ''); },
        contains: function(name) { return ts(node.className).match(new RegExp("\\b" + name + "\\b")) != null; },
        item:     function(index) { return (ts(node.className).split(" ") || [])[index]; },
        toggle:   function(name) { this[this.contains(name) ? 'remove' : 'add'](name); },
        toString: function() { return ts(this.node.className); }
      };
      
      Object.defineProperty(this.classList, 'length', { 
        get: function() { return ts(node.className).split(" ").length; }
      });
    };
  }
  
  JNode.List = function JList(nodes)
  {
    this.constructor = JList;
    
    for (var i = 0, l = nodes.length; i < l; ++i)
      this._process(i, nodes[i]);
      
    this.length = l;
  };

  JNode.List.prototype = {
    _process: function _process(index, node) 
    {
      this[index] = (node instanceof JNode) ? node : new JNode(node);
    },
    
    invoke: function invoke()
    {
      var args   = SLICE.call(arguments, 0),
          method = args.shift();
          
      for (var i = 0; i < this.length; ++i)
        this[i][method].apply(this[i], args);
        
      return this;
    },
    
    pluck: function pluck(prop)
    {
      var props = [];
      
      for (var i = 0; i < this.length; ++i)
        props.push(this[i].prop(prop));
        
      return props;
    },
    
    each: function each(func, context)
    {
      JNode.each(this, func, context);
      return this;
    },
    
    filter: function filter(func, context)
    {
      var nodes = [];
      
      context && (func = func.bind(context));
      
      for (var i = 0, l = this.length; i < l; ++i)
        if (false !== func(this[i], i, this))
          nodes.push(this[i]);
          
      return new JNode.List(nodes);
    }
  };
  
JNode.Storage = {};

JNode.getStorage = function getStorage()
{
  if (!JNode.Storage[0])
    JNode.Storage[0] = {};
    
  return JNode.Storage[0];
};

JNode.store = function store(needle, value)
{
  JNode.getStorage()[needle] = value;
};

JNode.fetch = function fetch(needle, fallback)
{
  var storage = JNode.getStorage();
  
  if (!storage[needle])
    storage[needle] = fallback;
    
  return storage[needle];
};

JNode.purge = function purge()
{
  JNode.release(window);
  delete JNode.Storage[0];
};

JNode.prototype.getStorage = function getStorage()
{
  var uid;
  
  if (!this.node._jnode_uid) {
    if (this.node === document)
      uid = 1;
    else {
      if (this.node.uniqueID)
        uid = this.node.uniqueID;
      else
        uid = ++STORAGE_ID_COUNTER;
        
      this.node._jnode_uid = uid;
    }
  } else 
    uid = this.node._jnode_uid;
  
  if (!JNode.Storage[uid])
    JNode.Storage[uid] = {};
    
  return JNode.Storage[uid];
};

JNode.prototype.store = function store(needle, value)
{
  var storage = this.getStorage();
  storage[needle] = value;
  
  return this;
};

JNode.prototype.fetch = function fetch(needle, fallback)
{
  var storage = this.getStorage();
  
  if (!storage[needle])
    storage[needle] = fallback;
    
  return storage[needle];
};

JNode.prototype.purge = function purge()
{
  JNode.release(this.node);
  
  if (this.node._jnode_uid)
    delete JNode.Storage[this.node._jnode_uid];
  
  if (this.node !== document) {
    var childs = this.childs(true);
    if (childs) childs.invoke('purge');
  }
  
  return this;
};
  
(function() {
  var MOUSEENTER_LEAVE = ('onmouseleave' in EL_DIV && 'onmouseenter' in EL_DIV);
  
  function getRegistry(element) 
  {
    if (element === window)
      return JNode.fetch('_eventhandler', {});
      
    return new JNode(element).fetch('_eventhandler', {});
  }
  
  function createResponder(element, eventName, handler, once)
  {
    var responder = (function() {
      if (!MOUSEENTER_LEAVE && ["mouseenter", "mouseleave"].indexOf(eventName) > -1) {
        return function(event) {
          var parent = event.relatedTarget;
          
          while (parent && parent !== element) {
            try { 
              parent = parent.parentNode; 
            } catch(e) {
              return;
            }
          }
          
          if (parent === element)
            return;
            
          handler.call(element, event || window.event);
        };
      }
      
      if (eventName.indexOf(":") == -1) {
        return function(event) { 
          handler.call(element, event || window.event); 
        };
      }
      
      return function(event) {
        if (!event.eventName || event.eventName != eventName)
          return;
          
        handler.call(element, event || window.event);
      };
    })();
    
    if (once === true) {
      responder = (function(responder) {
        return function(event) {
          JNode.release(element, eventName, handler, useCapture);
          responder(event);
        };
      })(responder);
    }
    
    return responder;
  }
  
  function register(element, eventName, handler, useCapture, once) 
  {
    var registry = getRegistry(element);
    
    if (!registry[eventName])
      registry[eventName] = [];
    else
      for (var i = 0, l = registry[eventName].length; i < l; ++i)
        if (registry[eventName].handler === handler 
         && registry[eventName].useCapture === useCapture)
          return;
    
    var entry = {
      eventName:  eventName,
      handler:    handler,
      responder:  createResponder(element, eventName, handler, once),
      useCapture: useCapture
    };
    
    registry[eventName].push(entry);
    return entry;
  }
  
  function unregister(element, eventName, handler, useCapture) 
  {
    var registry = getRegistry(element);
    
    if (!registry[eventName])
      return null;
    
    for (var entry, i = 0, l = registry[eventName].length; i < l; ++i) {
      entry = registry[eventName][i];
      
      if (entry.handler === handler 
       && entry.useCapture === useCapture) {
        registry[eventName].splice(i, 1);
        return entry;
      }
    }
    
    return null;
  }
  
  function realEventName(eventName)
  {
    switch (eventName) {
      case 'mouseenter':
        eventName = 'mouseover';
        break;
        
      case 'mouseleave':
        eventName = 'mouseout';
        break;
    }
  
    return eventName;
  }
  
  function releaseAll(element, useCapture) 
  {
    var registry = getRegistry(element),
        capture  = useCapture ? !!useCapture : null;
        
    var keys = Object.keys(registry);
    
    for (var i = 0, l = keys.length; i < l; ++i) {
      var useCapture = capture, name = keys[i];
      
      for (var i2 = 0, l2 = registry[name].length; i2 < l2; ++i2) {
        if (useCapture === null)
          useCapture = registry[name][i2].useCapture;
        else if (useCapture !== registry[name][i2].useCapture)
          continue;
          
        JNode.release(element, name, registry[name][i2].handler, useCapture);
      } 
    }
  }
  
  function releaseType(element, eventName, useCapture) 
  {
    var registry = getRegistry(element)[eventName] || [],
        capture  = useCapture ? !!useCapture : null;
        
    for (var i = 0, l = registry.length; i < l; ++i) {
      var useCapture = capture;
      
      if (useCapture === null)
        useCapture = registry[i].useCapture;
      else if(useCapture !== registry[i].useCapture)
        continue;
      
      JNode.release(element, eventName, registry[i].handler, useCapture);
    }
  }
  
  JNode.listen = function listen(element, eventName, handler, useCapture, once)
  {
    if (element instanceof JNode)
      element = element.node;
      
    useCapture = useCapture && useCapture === true;
    
    if (eventName === 'dom:loaded' || eventName === 'dom:ready') {
      if (JNode.loaded === true) {
        handler.call(element);
        return;
      }
      
      eventName = 'DOMContentLoaded';
    }
    
    var responder = register(element, eventName, handler, useCapture, once).responder;
    
    if (eventName.indexOf(":") == -1) {
      eventName = realEventName(eventName); 
      element.addEventListener(eventName, responder, useCapture);
      return;
    }
    
    element.addEventListener("dataavailable", responder, useCapture);
  };
  
  JNode.one = function one(element, eventName, handler, useCapture)
  {     
    JNode.listen(element, eventName, handler, useCapture, true);
  };  
  
  JNode.release = function release(element, eventName, handler, useCapture)
  {
    if (element instanceof JNode)
      element = element.node;
      
    if (typeof eventName == "boolean") {
      useCapture = eventName;
    } else if (typeof handler == "boolean") {
      useCapture = handler;
    }
    
    var length = arguments.length;
    
    if (length === 1 || (length === 2 && typeof useCapture != "undefined")) {
      releaseAll(element, useCapture);
      return;
    }
    
    if (length === 2 || (length === 3 && typeof useCapture != "undefined")) {
      releaseType(element, eventName, useCapture);
      return;
    }
    
    var responder = unregister(element, eventName, handler, useCapture);
    
    if (!responder || !responder.responder)
      return;
      
    responder = responder.responder;
    
    if (eventName.indexOf(":") == -1) {
      eventName = realEventName(eventName);
      element.removeEventListener(eventName, responder, useCapture);
      return;
    }
    
    element.removeEventListener("dataavailable", responder, useCapture);
  };
  
  JNode.fire = function fire(element, eventName, meta, bubble) {
    bubble = bubble ? !!bubble : true;
    
    if (!meta) meta = {};
    
    var event = document.createEvent('HTMLEvents');
    event.initEvent('dataavailable', bubble, true);
    
    event.eventName = eventName;
    event.meta = meta;
    
    element.dispatchEvent(event);
  };
  
  JNode.prototype.listen = function listen(eventName, handler, useCapture)
  {
    JNode.listen(this.node, eventName, handler, useCapture);
    return this;
  };
  
  JNode.prototype.one = function one(eventName, handler, useCapture)
  {
    JNode.one(this.node, eventName, handler, useCapture);
    return this;
  };
  
  JNode.prototype.release = function release(eventName, handler, useCapture)
  {
    var args = SLICE.call(arguments);
    args.unshift(this.node);
    
    JNode.release.apply(null, args);
    return this;
  };
  
  JNode.prototype.fire = function fire(eventName, meta, bubble)
  {
    JNode.fire(this.node, eventName, meta, bubble);
    return this;
  };
  
  JNode.loaded = false;
  JNode.listen(document, 'DOMContentLoaded', function() { JNode.loaded = true; });
  
  JNode.Event = function JEvent(event)
  {
    this.constructor = JEvent;
    
    this.event = event;
    
    this.stopped = false;
    
    if (this.hook) this.hook();
  };
  
  JNode.Event.prototype = {
    element: function element()
    {
      var node = this.event.target || this.event.srcElement, 
          type = this.event.eventName;
           
      var currentTarget = this.event.currentTarget;

      if (currentTarget && currentTarget.tagName) {
        if (type === 'load' || type === 'error' ||
          (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
            && currentTarget.type === 'radio'))
              node = currentTarget;
      }
      
      return new JNode(node);
    },
    
    stop: function stop() 
    {
      this.event.preventDefault();
      this.event.stopPropagation();
      
      this.stopped = true;
      return this;
    },
    
    pointer: function pointer() 
    {
      return { 
        x: this.event.pageX, 
        y: this.event.pageY 
      };
    }
  };
})();
  
var JSONP_CALLBACK_COUNTER = 0;

JNode.Request = function JRequest(url, options)
{
  this.constructor = JRequest;
  
  this.url = url;
  
  this.options = JNode.merge({ 
    method:       "post",
    data:         {}, 
    async:        true,
    jsonp:        null,
    contentType:  'application/x-www-form-urlencoded',
    encoding:     'UTF-8',
    parseHtml:    false,
    
    onSuccess:    JNode.noop,
    onFailure:    JNode.noop,
    onProgress:   JNode.noop,
    onUpload:     JNode.noop
  }, options || {});
  
  this.method = this.options.method;
  this.request();
};

JNode.Request.prototype = {    
  request: function request()
  {
    if (this.options.jsonp) {
      var jsonp = '_jnode_jsonp_ref_' + JSONP_CALLBACK_COUNTER++;
      window[jsonp] = this.options.jsonp;
      
      var url = this.url;
      url += (url.indexOf('?') == -1 ? '?' : '&') + 'jsonp=' + jsonp;
      
      var script = new JNode('script');
      script.attr({ type: 'text/javascript', src: url });
      
      script.listen("load", function() { 
        JNode.defer(function() {
          script.remove();
          delete window[jsonp];
        });
      });
      
      script.append(document.body);        
      return;
    }
    
    this.transport = new XMLHttpRequest;
    this.transport.open(this.method, this.url, this.options.async);
    
    this.transport.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    this.transport.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*');
    
    var data = this.options.data;
    
    if (this.method === 'post') {  
      this.transport.setRequestHeader('Content-type', this.options.contentType
        + (this.options.encoding ? '; Charset=' + this.options.encoding : ''));
        
      if ((window.FormData && data instanceof FormData)
       || (window.File && data instanceof File)) {
        try {
          this.transport.upload.addEventListener('progress', this.options.onProgress);
          this.transport.upload.addEventListener('load', this.options.onUpload);
        } catch (e) {
        }
      } else if (typeof data !== "string") {
        data = [];
        
        JNode.each(this.options.data, function(v, k) { data.push(k + "=" + v); });
        data = data.join('&');
      }
    }
    
    try {
      this.transport.addEventListener('load', this.loaded.bind(this));
      this.transport.addEventListener('error', this.options.onFailure);
      this.transport.addEventListener('abort', this.options.onFailure);
    } catch (e) {
      this.transport.onload = this.loaded.bind(this);
      this.transport.onerror = this.options.onFailure;
      this.transport.onabort = this.options.onFailure;
    }
    
    this.transport.send(data);
  },
  
  loaded: function loaded()
  {
    var res  = { text: '', json: null, xml: null }, 
        type = this.transport.getResponseHeader('Content-type');
    
    res.text = this.transport.responseText;
    
    switch (type.toLowerCase().replace(/;\s*charset=.*$/i, '')) {
      case 'application/json':
      case 'text/json':
        res.json = JSON.parse(res.text);
        break;
      
      case 'application/ecmascript':
      case 'application/javascript':
      case 'text/javascript':
        try { eval(res.text); } catch (e) {}
        break;
        
      case 'text/html':
        if (this.parseHTML === true)
          res.html = new JNode(res.text);
    }
    
    if (this.transport.responseXML)
      res.xml = this.transport.responseXML;
    
    if (this.transport.status >= 200 
     && this.transport.status < 300) {
      this.options.onSuccess(res);
      return;
    }
    
    this.options.onFailure(res);
  } 
};

JNode.prototype.load = function load(url, options)
{
  options || (options = {});
  
  options.onSuccess = function(res) {
    this.update(res.text);
  }.bind(this);
  
  new JNode.Request(url, options);
  return this;
};
  
(function() {
  var CSS_TRANSFORM = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
  
  var CSS_TRANSITION = (function() {
    var vendors = { o: "o", webkit: "webkit", moz: "", ms: "MS", "": "" },
        vendor  = false,
        prefix  = {};
    
    for (var i in vendors) {
      var p = i ? "-" + i + "-" : "";
      EL_DIV.style.cssText = p + "transition-property:all";
      if (EL_DIV.style.getPropertyValue(p + "transition-property") == "all") {
        vendor = p;
        prefix = vendors[i];
        break;
      }
    }
    
    EL_DIV.style.cssText = '';
    
    if (vendor === false)
      return false;
    
    function mkevent(name) { return prefix ? prefix + name : name.toLowerCase(); }
      
    return {  
      "vendor": vendor,
      "tevent": mkevent("TransitionEnd"),
      "aevent": mkevent("AnimationEnd")
    };
  })();
  
  var DURATION_TRANSLATION = { "fast": .2, "slow": 2, "instant": .1, "default": .5 };
  
  var ANIM_DEFAULT_OPTIONS = { duration: .5, delay: 0, ease: 'linear' };
  
  function isNumOrStr(obj) {
    return (["number", "string"].indexOf(typeof obj) > -1);
  }
  
  function getDuration(duration) {
    if (isNaN(duration))
      return DURATION_TRANSLATION[duration] || .5;
      
    return duration;
  }
  
  function useDelay(options, func) {
    if (options.delay) {
      var delay = options.delay;
      options.delay = 0;
      
      setTimeout(func.bind(func), delay * 1000);
      return;
    }
    
    func();
  }
  
  JNode.prototype.anim = function anim(styles, options, callback)
  {
    var tstyle = "", sstyle = "", endEvent, doc = new JNode(document);
    
    if (typeof options === "function")
      callback = options, options = {};
    
    options = JNode.merge(ANIM_DEFAULT_OPTIONS, options || {});
    options.duration = getDuration(options.duration);
    
    if (styles.indexOf(":") === -1) {       
      endEvent = CSS_TRANSITION.aevent;
      tstyle = sstyle = CSS_TRANSITION.vendor + "animation:" + styles + " " 
        + options.duration + "s " + options.ease + " " + options.delay + "s";
    } else {
      var setter = {}, transf = ""; 
      endEvent = CSS_TRANSITION.tevent;
      
      for (var i = 0, s = styles.split(';'), l = s.length; i < l; ++i) {
        var split = s[i].split(':'), prop = split[0], val = split[1];
        
        if (!prop) continue;
        
        if (CSS_TRANSFORM.test(prop)) {
          transf += " " + prop + "(" + val + ")";
          continue;
        }
        
        var value = this.node.style.getPropertyValue(prop);
        
        if (value === "" || value === "auto")
          setter[prop] = this.style(prop);
          
        sstyle += ";" + prop + ':' + val;
      }
      
      tstyle = sstyle + ";" + CSS_TRANSITION.vendor 
        + "transition:all " + options.duration + "s " 
        + options.ease + " " + options.delay + "s";
      
      if (setter) this.style(setter);
      if (transf) tstyle += ";" + CSS_TRANSITION.vendor + "transform:" + transf;
    }
    
    var handled = false, handler = function() {
      if (handled) return;
      doc.release(endEvent, handler, true);
      
      JNode.defer(function() {
        var nstyle = this.node.style;
        nstyle.removeProperty(CSS_TRANSITION.vendor + "transition");
        nstyle.removeProperty(CSS_TRANSITION.vendor + "animation");
      
        callback && JNode.defer(callback, this);
      }.bind(this));
      
      handled = true;
    }.bind(this);
    
    doc.listen(endEvent, handler, true);
    JNode.defer(function() { this.style(tstyle); }.bind(this));
    
    setTimeout(handler, ((options.duration || .1) + 2) * 1000);
    return this;
  };
  
  if (!CSS_TRANSITION) {
    JNode.prototype.anim = function anim(styles, unused, callback)
    {
      unused = void 0;
    
      if (styles.indexOf(":") > -1) {
        var sstyle = "", transf = "";
        
        for (var i = 0, s = styles.split(";"), l = s.length; i < l; ++i) {
          var split = s[i].split(':'), prop = split[0], val = split[1];
          
          if (!prop) continue;
          
          if (CSS_TRANSFORM.test(prop)) {
            transf += " " + prop + "(" + val + ")";
            continue;
          }
            
          sstyle += ";" + prop + ':' + val;
        }
        
        if (transf) sstyle += ";-ms-transform:" + transf;
        this.node.style.cssText += sstyle;
      }
      
      callback(this);
      return this;
    };
  }
  
  JNode.prototype.fade = function fade(options, callback) 
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
      
    callback = JNode.wrap(callback || JNode.noop,
      function(orig, node) { node.hide(); JNode.defer(orig, node); });
    
    useDelay(options, function() {
      this.style("opacity:1");
      this.anim("opacity:0", options, callback);
    }.bind(this));
    
    return this;
  };

  JNode.prototype.appear = function appear(options, callback) 
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
    
    useDelay(options, function() {
      this.style("opacity:0;").show();
      this.anim("opacity:1", options, callback);
    }.bind(this));
    
    return this;
  };

  JNode.prototype.puff = function puff(options, callback)
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
      
    return this.anim("opacity:0;scale:4;position:absolute", options, callback);
  };
  
  JNode.prototype.fold = function fold(options, callback) 
  {
    var overflow = this.style("overflow"),
        width    = this.node.style.getPropertyValue("width"),
        height   = this.node.style.getPropertyValue("height");
    
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
    
    options.duration = getDuration(options.duration) / 2.0
    
    var options2 = JNode.merge({}, options);
    options2.delay = .2;
    
    useDelay(options, function() {
      this.style("overflow:hidden");
      this.anim("height:10px;", options, function(node) {
        node.anim("width:0px;", options2, function(node) {
          node.hide().style({ overflow: overflow, width: width, height: height });
          callback && JNode.defer(callback, node);
        }); 
      }); 
    }.bind(this));
    
    return this;
  };
  
  JNode.prototype.blind = function blind(dir, options, callback)
  {
    var height   = this.height(),
        overflow = this.style("overflow");
        
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
    
    useDelay(options, ((dir && dir === "down") ? 
      function() {
        this.style("overflow:hidden;height:0px;").show();
        JNode.defer(function() {
          this.anim("height:" + height + "px", options, function(node) {
            node.style("overflow:" + overflow);
            callback && JNode.defer(callback, node);
          });
        }.bind(this));
      } :
      function() {
        this.style("overflow:hidden");
        this.anim("height:0px;", options, function(node) {
          node.hide().style("height:" + height + "px;overflow:" + overflow);
          callback && JNode.defer(callback, node);
        });
      }
    ).bind(this));
    return this;
  };
  
  JNode.prototype.shrink = function shrink(options, callback)
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
    
    return this.anim("scale:0", options, function(node) {
      node.hide();
      callback && JNode.defer(callback, node);
    });
  };
  
  JNode.prototype.grow = function grow(options, callback)
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
      
    this.show();
    
    JNode.defer(function() { this.anim("scale:1", options, callback); }.bind(this));
    return this;
  };
})();
  
JNode.Query = (function(undefined) {
  var T_ASSIGN    = 1,
      T_ARR_OPEN  = 2,
      T_ARR_CLOSE = 4,
      T_DELIM     = 8,
      T_STRING    = 16,
      T_NUMBER    = 32;
    
  var RE_OPERATOR = /[=\[\]]/,
      RE_NUMBER   = /^[0-9]+$/;
  
  var toString = Object.prototype.toString;
  
  var STRING_TYPE  = toString.call(''),
      OBJECT_TYPE  = toString.call({}),
      ARRAY_TYPE   = toString.call([]),
      NUMBER_TYPE  = toString.call(0),
      BOOLEAN_TYPE = toString.call(true),
      DATE_TYPE    = toString.call(new Date);
  
  var Tokenizer = {
    next: function next()
    {
      if (this.offs + 1 > this.slen)
        return null;
        
      return this.data.charAt(this.offs++);
    },
    
    tokenize: function tokenize(data, delim)
    {
      var tokens = [], token, split = data.split(delim || '&');
      
      for (var i = 0, l = split.length; i < l; ++i) {
        this.data = split[i];
        this.slen = this.data.length;
        this.offs = 0;
        
        while (token = this.next()) {
          switch (token) {
            case '=':
              tokens.push(T_ASSIGN);
              break;
              
            case '[':
              tokens.push(T_ARR_OPEN);
              break;
              
            case ']':
              tokens.push(T_ARR_CLOSE);
              break;
              
            default:
              var value = token;
              
              while (token = this.next()) {
                if (RE_OPERATOR.test(token)) {
                  --this.offs;
                  break;
                }
                
                value += token;
              }
              
              if (RE_NUMBER.test(value))
                tokens.push(T_NUMBER, parseInt(value));
              else
                tokens.push(T_STRING, decodeURIComponent(value));
          }
        }
        
        tokens.push(T_DELIM);
      }
      
      delete this.data, this.slen, this.offs;
      return tokens;
    }
  };
  
  var Decoder = {
    parse: function parse(query, delim)
    {
      this.delim   = delim || '&';
      this.tokens  = Tokenizer.tokenize(query, delim);
      
      var res = {};
      
      while (this.tokens.length) {
        this.expect(T_STRING);
        
        var name = this.next();
        
        if (typeof res[name] === "undefined")
          res[name] = this.init();
          
        this.collect(res[name], res, name);
      }
      
      return res;
    },
    
    collect: function collect(host, root, key)
    {
      var token;
      
      switch (token = this.next()) {
        case T_ARR_OPEN:
          this.access(host);
          break;
          
        case T_ASSIGN:
          this.expect(T_STRING|T_NUMBER);
          root[key] = this.next();
          this.expect(T_DELIM);
          break;
          
        case T_DELIM:
          root[key] = true;
          break;
          
        default:
          throw new Error("Syntax error: unexpected " + this.lookup(token) 
            + ', expected "[", "=" or "' + this.delim + '"');
      }
    },
    
    access: function access(host)
    {
      var token;
      
      switch (token = this.next()) {
        case T_ARR_CLOSE: 
          var key = host.push(this.init()) - 1;
          this.collect(host[key], host, key);
          break;
          
        case T_NUMBER:
          var index = this.next();
          this.expect(T_ARR_CLOSE);
          
          if (host.length <= index) {
            for (var i = host.length; i < index; ++i)
              host.push(null);
            
            host.push(this.init());
          }
              
          this.collect(host[index], host, index);
          break;
          
        case T_STRING:
          var name = this.next();
          this.expect(T_ARR_CLOSE);
          
          if (typeof host[name] == "undefined")
            host[name] = this.init();
          
          this.collect(host[name], host, name);
          break;
          
        default:
          throw new Error("Syntax error: unexpected " + this.lookup(token) 
            + ', expected "]", (number) or (string)');
      }
    },
    
    ahead: function ahead(seek)
    {
      return this.tokens[seek || 0];
    },
    
    init: function init()
    {
      var token;
      
      switch (this.ahead()) {
        case T_ARR_OPEN:
          switch (token = this.ahead(1)) {
            case T_ARR_CLOSE:
            case T_NUMBER:
              return [];
              
            case T_STRING:
              return {};
              
            default:
              throw new Error('Syntax error: unexpected ' + this.lookup(token) 
                + ', expecting "]", (number) or (string)');
          }
          
          break;
        
        default:
          return;
      }
    },
    
    lookup: function lookup(type) 
    {
      switch (type) {
        case T_ASSIGN:
          return '"="';
          
        case T_ARR_OPEN:
          return '"["';
          
        case T_ARR_CLOSE:
          return '"]"';
          
        case T_STRING:
          return '(string)';
          
        case T_NUMBER:
          return '(number)';
          
        case T_DELIM:  
          return '"' + this.delim + '"';
          
        default:
          return '?(' + type + ')?';
      }
    },
    
    next: function next()
    {
      return this.tokens.length ? this.tokens.shift() : null;
    },
    
    expect: function expect(tokens)
    {
      if (this.tokens.length && (this.tokens[0] & tokens) === 0) {
        var expecting = [];
        
        for (var i = 0; i <= 32; i += i)
          if (i & tokens !== 0)
            expecting.push(lookup(i));
        
        throw new Error("Syntax error: unexpected " + this.lookup(this.tokens[0]) 
          + ", expecting " + expecting.join(" or "));
      }
      
      if (this.tokens.length) this.tokens.shift();
    }
  };
  
  var Encoder = {
    parse: function parse(object, delim)
    {
      this.delim = delim || '&';
      
      var result = [], value;
      
      for (var i in object) {
        if (!object.hasOwnProperty(i))
          continue;
        
        if ((value = this.serialize(object[i], i)) !== "")
          result.push(value);
      }
      
      return result.join(this.delim);
    },
    
    serialize: function serialize(value, label)
    {            
      if (typeof value === "undefined" || value === null)
        return "";
        
      switch (toString.call(value)) { 
        case DATE_TYPE:
          return label + "=" + (+value);         
          
        case STRING_TYPE:
          value = this.encode(value);
          
        case NUMBER_TYPE:
          return label + "=" + value;
          
        case BOOLEAN_TYPE:
          return label + "=" + (value ? 1 : 0);
          
        case ARRAY_TYPE:
        case OBJECT_TYPE:
          return this.access(value, label);
        
        default:
          throw new Error('Parse error: value for key "' + label + '" is not serializable');
      }
    },
    
    access: function access(value, label)
    {
      var result = [], value;
      
      if (toString.call(value) === ARRAY_TYPE)
        for (var i = 0, l = value.length; i < l; ++i)
          this.handle(result, label, value[i], i);
      else
        for (var i in value)
          if (value.hasOwnProperty(i))
            this.handle(result, label, value[i], i);
            
      return result.join(this.delim);
    },
    
    handle: function handle(stack, label, value, prop)
    {
      var res;
      
      if ((res = this.serialize(value, label + "[" + prop  + "]")) !== "")
        stack.push(res);
    },
    
    encode: function encode(value)
    {
      return encodeURIComponent(value);
    }
  };
  
  return {
    decode: function decode(query, delim)
    {
      return Decoder.parse(query, delim);
    },
    
    encode: function encode(object, delim) 
    {
      return Encoder.parse(object, delim);
    }
  }
})();  
  JNode.GET = {};

  (function() {
    var search = window.location.search.substring(1);
    
    if (search) {
      var delim = search.replace(/[^;&]+/g, '').substr(0, 1);
      JNode.GET = JNode.Query.decode(search, delim);
    }
  })();
    
  Object.freeze(JNode.GET);
  
  var RX_EL_ID   = /^(\w+)?#([\w:]+)$/,
      RX_EL_NAME = /^[a-zA-Z]+$/;
  
  var EMPTY_JNODE_LIST = new JNode.List(EMPTY_ARRAY);
  
  JNode.find = function find(selector, context, first) 
  {
    if (context === true) {
      first   = true;
      context = null;
    }
    
    context = context 
      ? (context instanceof JNode)
        ? context.node : context : document;
    
    var nodes = [],
        match;
        
    if (selector.toLowerCase() === 'body') {
      match = document.body;
      first = true;
    }
    if (selector.match(RX_EL_ID)) {
      match = document.getElementById(RegExp.$2);
      first = true;
      
      if (RegExp.$1 && match.nodeName.toUpperCase() != RegExp.$1.toUpperCase())
        match = null;
    }
    else if (selector.match(RX_EL_NAME)) {
      match = context.getElementsByTagName(selector);
      
      if (first) 
        match = match ? match[0] : null;
    }
    else {
      match = context["querySelector" + (first ? "" : "All")](selector) || [];
      
      if (first && Array.isArray(match))
        match = null;
    }
    
    if (first)
      return match ? new JNode(match) : null;
    
    if (!match.length) 
      return EMPTY_JNODE_LIST;
    
    for (var i = 0, l = match.length; i < l; ++i)
      nodes.push(new JNode(match[i]));
      
    return new JNode.List(nodes);
  };
  
  JNode.match = (function() {
    var html    = document.documentElement,
        matches = html.matchesSelector || html.mozMatchesSelector 
               || html.webkitMatchesSelector || html.msMatchesSelector
               || html.oMatchesSelector;
    
    if (!matches) {
      return function match(expr, node) { 
        var reset = false;
        
        if (!node.parentNode) {
          reset = node.style.display;
          node.style.display = 'none';
          document.body.appendChild(node);
        }
        
        var matches = SLICE.call(node.parentNode.querySelectorAll(expr), 0).indexOf(node) !== -1;
        
        if (reset !== false) {
          document.body.removeChild(node);
          node.style.display = reset;
        }
        
        return matches;
      };
    }
    
    var disconnectedMatch = !matches.call(document.createElement("div"), "div"),
        pseudoWorks       = false;
    
    try {
      matches.call(html, "[test!='']:sizzle");
    } catch(pseudoError) {
      pseudoWorks = true;
    }
    
    var pseudoRegex = /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/;
    
    return function match(expr, node) {
      expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
      
      try {
        if (pseudoWorks || pseudoRegex.test(expr) && !(/!=/.test(expr))) {
          var ret = matches.call(node, expr);
          
          if (ret || !disconnectedMatch ||
            node.document && node.document.nodeType !== 11 ) {
            return ret;
          }
        }
      } catch(e) {}
      
      if (disconnectedMatch && !node.parentNode) {
        var parentNode = new JNode("div");
        parentNode.style("display:none;position:absolute;top:-100px;left:-100px").append(document.body); 
        parentNode.insert(node.cloneNode(true));
        
        var res = JNode.match(expr, node);
        parentNode.remove();
        
        return res;
      }
      
      return false;
    };
  })();
  
  JNode.init = function init(indicator)
  {
    if (indicator instanceof Event)
      return new JNode.Event(indicator);
    
    if (arguments.length === 1) {
      if (indicator instanceof Element || indicator === document)
        return new JNode(indicator);
      
      var e = document.getElementById(indicator);
      return e ? new JNode(e) : null;
    }
      
    var nodes = [];
    
    for (var i = 0, r, l = arguments.length; i < l; ++i)
      if ((r = init(arguments[i])) !== null) 
        nodes.push(r);
       
    return nodes ? new JNode.List(nodes) : null;
  };
  
  JNode.defer = function defer(func) 
  {
    var args = SLICE.call(arguments, 1);
    
    return window.setTimeout(function() {
      func.apply(null, args);
    }, 10);
  };
  
  JNode.each = function each(object, func, context)
  {
    context && (func = func.bind(context));
    
    if (typeof object === "function")
      throw new TypeError;
    
    if (Array.isArray(object) || object.length != void 0) {
      for (var i = 0, l = object.length; i < l; ++i)
        if (false === func(object[i], i, object))
          break;
        
      return;
    }
    
    var keys = Object.keys(object);
    
    for (var i = 0, k, l = keys.length; i < l; ++i)
      if (false === func(object[k = keys[i]], k, object))
        break;
  };
  
  JNode.merge = function merge(dest)
  {
    SLICE.call(arguments, 1).forEach(function(source) {
      JNode.each(source, function(v, k) {
        dest[k] = source[k];
      });
    });
    
    return dest;
  };
  
  JNode.wrap = function wrap(orig, call)
  {
    return function() {
      var args = SLICE.call(arguments, 0);
      args.unshift(orig.bind(this));
      
      return call.apply(this, args);
    };
  };
  
  JNode.noop = function noop() {};
  
  JNode._$$ = window.$$;
  JNode._$  = window.$;
  window.$$ = JNode.find;
  window.$  = JNode.init;
  
  JNode.noConflict = function noConflict() 
  {
    window.$$ = JNode._$$;
    window.$  = JNode._$;
    
    return {
      '$$': JNode.find,
      '$':  JNode.init
    };
  };
  
  return JNode;
})();
