/*!
 * JNode: lightweight javascript/dom framework for modern browsers.
 *
 * supported browsers:
 * - Firefox 3.6+ / Seamonkey 2 / Fennec       | [X] tested (Firefox 3.6 / Seamonkey 2.0 without transitions, Fennec needs testing)
 * - Chrome / Safari 5.0+ / MobileWebkit       | [X] tested
 * - Opera 10.5+                               | [X] tested (without XMLHttpRequest 2. transitions may have bugs [Opera related])
 * - MSIE 9+                                   | [X] tested (without XMLHttpRequest 2, FileAPI and transitions/animations [maybe available in MSIE 10?])
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
  
  // ----------------------------------------------
  
  // private
  function fragment(html) 
  {
    var name = (html.match(/\<([\S]+)/) || [0, '*'])[1].toLowerCase();

    if (!CONTAINERS[name])
      name = '*';

    CONTAINERS[name].innerHTML = html;
    var element = CONTAINERS[name].childNodes[0].cloneNode(true);
    
    // reset
    CONTAINERS[name].innerHTML = '';
    return element;
  }
  
  // ----------------------------------------------
  
  // class-body
  function JNode(tag, attr) 
  {   
    // set constructor
    this.constructor = JNode;
    
    // constructor code
    this.node = (tag.nodeName || tag === document) // tag is already a node
      ? tag : (tag instanceof JNode) // jnode-object
        ? tag.node : (tag.substr(0, 1) !== '<') // tag or html
          ? document.createElement(tag) : fragment(tag);
    
    // allow hooks
    if (this.hook) this.hook();
    
    // classlist polyfill
    this._classList();
    
    // set attributes if available
    if (attr) this.attr(attr);
  }

  // prototype
  JNode.prototype = {
    // private
    _classList: function _classList() {
      this.classList = this.prop('classList');
    },
    
    /**
     * calls a method when the browser is in idle
     * 
     * @see     JNode.defer
     * @param   String          method
     * @param   ...
     * @return  JNode
     */
    defer: function defer() 
    {
      var args = SLICE.call(arguments, 0),
          call = args.shift(),
          self = this;
          
      JNode.defer(function() { self[call].apply(self, args); });
      return this;
    },
    
    /**
     * set/get attributes 
     *
     * @param   String|Object   needle
     * @param   String          value
     * @return  mixed
     */
    attr: function attr(needle, value) 
    {
      if (arguments.length === 2) {
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
    
    /**
     * set/get style-properties
     *
     * @param   String|Object   needle
     * @param   String          value
     * @return  mixed
     */
    style: function style(needle, value) 
    {
      if (arguments.length === 2) {
        if (value === "") {
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
        
        // check style first
        var value;
        
        if (!!(value = this.node.style.getPropertyValue(needle)))
          return value;
        
        return document.defaultView
          .getComputedStyle(this.node, null)
          .getPropertyValue(needle);
      }
      
      var expr = "";
      JNode.each(needle, function(v, k) { this.style(k, v); }, this);
      return this;
    },
    
    /**
     * hides the element
     *
     * @return  JNode
     */
    hide: function hide()
    {
      return this.style("display:none;");
    },
    
    /**
     * removes the display:hide property
     *
     * @return  JNode
     */
    show: function show()
    {
      if (this.style("display") == "none")  
        return this.style("display", "");
        
      return this;
    },
    
    /**
     * get/set dataset properties
     *
     * @param   String    needle
     * @param   mixed     value
     * @return  mixed
     */
    data: function data(needle, value) 
    {
      if (arguments.length === 2) {
        this.node.dataset[needle] = value;
        return this;
      }
      
      return this.node.dataset[needle];
    },
    
    /**
     * select elements inside
     *
     * @param   String        selector
     * @return  Array<JNode>
     */
    select: function select(selector) 
    {
      return JNode.find(selector, this.node);
    },
    
    /**
     * set/get properties of the dom-node
     *
     * @param   String        needle
     * @param   mixed         value
     * @return  mixed
     */
    prop: function prop(needle, value) 
    {
      if (arguments.length === 2) {
        this.node[needle] = value;
        return this;
      }
      
      return this.node[needle];
    },
    
    /**
     * creates a new unique id
     *
     * @return  String
     */
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
    
    /**
     * wraps the element into an other element
     *
     * @param   Element|JNode|String    wrapper
     * @return  JNode
     */
    wrap: function wrap(wrapper)
    {
      // TODO: use INSERTIONS
      
      if (!(wrapper instanceof JNode))
        wrapper = new JNode(wrapper);
      
      // use real DOM-methods instead of JNode wrapper methods
      if (this.node.parentNode) 
        this.node.parentNode.replaceChild(wrapper.node, this.node);
        
      wrapper.node.appendChild(this.node);
      
      return wrapper;
    },
    
    /**
     * removes the element from its parent
     *
     * @return  JNode
     */
    remove: function remove()
    {
      this.purge().node.parentNode.removeChild(this.node);
      return this;
    },
    
    /**
     * returns all childnodes
     *
     * @param   Boolean       scope
     * @return  Array<JNode>
     */
    childs: function childs(scope) 
    { 
      if (scope && scope === true) {
        var nodes = [];
        
        for (var i = 0, l = this.node.childNodes.length; i < l; ++i)
          if (this.node.childNodes[i].nodeName != '#text')
            nodes.push(new JNode(this.node.childNodes[i]));
          
        return new JNode.List(nodes);
      }
      
      return JNode.find("*", this.node);
    },
    
    /**
     * returns the first matching node for the given css-selector
     *
     * @param   String        selector
     * @return  JNode
     */
    first: function first(selector) 
    {
      return JNode.find(selector || '*', this.node, true);
    },
    
    /**
     * return tue if the given selector would match this node
     *
     * @param   String    selector
     * @return  Boolean
     */
    match: function match(selector)
    {
      return JNode.match(selector, this.node);
    },
    
    /**
     * returns the parent-node as JNode
     *
     * @return  JNode
     */
    parent: function parent()
    {
      return this.node.parentNode 
        ? new JNode(this.node.parentNode) : this;
    },
    
    /**
     * walks the DOM up
     * 
     * @param   String        selector
     * @return  mixed
     */
    up: function up(selector) 
    {
      if (arguments.length === 0) 
        return this.parent();
      
      if (typeof selector == "number") {
        var p = this.node.parentNode || null;
        
        while (--selector && p)
          p = p.parentNode || null
          
        return new JNode(p);
      }
      
      var p = this.node.parentNode;
      
      while (p && p.nodeName && !JNode.match(selector, p))
        p = p.parentNode;
      
      return p ? new JNode(p) : null;
    },
    
    /**
     * walks the DOM down
     *
     * @param   String        selector
     * @return  mixed
     */
    down: function down(selector, index) {
      if (arguments.length === 0)
        return this.first();
        
      if (!index || --index === 0)
        return JNode.find(selector, this.node, true);
        
      var childs = JNode.find(selector, this.node);
      return childs && childs[index] ? new JNode(childs[index]) : null;
    },
    
    /**
     * returns the next matching mode
     *
     * @param   String    selector
     * @return  mixed
     */
    next: function next(selector) {      
      var nodes  = this.parent().childs(true),
          length = nodes.length;
      
      // skip all nodes before this node
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
    
    /**
     * inserts content before/after/top/bottom/into the element-node
     *
     * @param   String|Element|JNode|Array<Node>|NodeList  data
     * @param   String                                     pos
     * @return  JNode
     */
    insert: function insert(data, pos)
    {
      pos = (pos || 'bottom').toLowerCase();
      
      // grab JNode.node
      if (data instanceof JNode)
        data = data.node;
      // create element(s)
      else if (!(data instanceof Node) && !Array.isArray(data))
        return this._insertString(data, pos);
      
      // grab method
      var mth = INSERTION[pos] || INSERTION['bottom'];
      
      if (!Array.isArray(data)) {
        // must be an element
        mth(this.node, data);
        return this;
      }
      
      if (pos === 'top' || pos === 'after') 
        data.reverse();
      
      //for each(var node in data)
      for (var i = 0, l = data.length; i < l; ++i) { 
        var node = data[i];
        
        if (node instanceof JNode)
          node = node.node;
          
        mth(this.node, node);
      }
      
      return this;    
    },
    
    // private
    _insertString: function(string)
    {
      var div = EL_DIV, mth;
        
      if (pos === 'before' || pos === 'after')
        mth = INSERTION.tags[(this.node.parentNode || this.node).nodeName.toUpperCase()];
      else
        mth = INSERTION.tags[this.node.nodeName.toUpperCase()];
     
      if (!!mth) {
        div.innerHTML = '&nbsp;' + t[0] + html + t[1];
        div.removeChild(div.firstChild);
        
        for (var i = t[2]; i--; )
          div = div.firstChild;
      } else {
        div = div.cloneNode(true);
        div.innerHTML = data;
      }
      
      // free memory
      EL_DIV.innerHTML = '';
      
      // save childs
      data = SLICE.call(div.childNodes, 0);
      
      // insert
      return this.insert(data);
    },
    
    /**
     * updates the nodes content
     *
     * @param   JNode|Element|String    content
     * @return  JNode
     */
    update: function update(content)
    { 
      // purge all childs
      var childs = this.childs();
      if (childs) childs.invoke('purge');
      
      if (content instanceof JNode)
        content = content.node;
      
      if (content instanceof Element) {
        this.node.innerHTML = '';
        return this.insert(content);
      }
      
      this.node.innerHTML = content;
      return this;
    },
    
    /**
     * adds this node to an other node.
     * if this node has already a parent-node, 
     * a clone (without `id`) will be used instead.
     *
     * @param   Element|JNode   element
     * @return  JNode
     */
    append: function append(element)
    {
      var node = this.node;
      
      if (node.parentNode) {
        node = node.cloneNode(true);
        
        if (node.getAttribute("id") != "")
          node.setAttribute("id", "");
      }
      
      if (element instanceof JNode)
        element = element.node;
        
      element.appendChild(node);
      return this;
    },
    
    /**
     * creates/returns the element-storage
     *
     * @return  Object
     */
    getStorage: function getStorage()
    {
      var uid;
      
      if (!this.node._jnode_uid) {
        // use JNode.getStorage() for `window` (uid = 0)
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
    },
    
    /**
     * store data in the element-storage
     *
     * @param   String    needle
     * @param   Object    value
     * @return  JNode
     */
    store: function store(needle, value)
    {
      var storage = this.getStorage();
      storage[needle] = value;
      
      return this;
    },
    
    /**
     * returns a stored value
     *
     * @param   String    needle
     * @param   Object    fallback
     * @return  mixed
     */
    fetch: function fetch(needle, fallback)
    {
      var storage = this.getStorage();
      
      if (!storage[needle])
        storage[needle] = fallback;
        
      return storage[needle];
    },
    
    /**
     * removes all event-handlers and storage-entries
     *
     * @return  JNode
     */
    purge: function purge()
    {
      JNode.release(this.node);
      
      if (this.node._jnode_uid)
        delete JNode.Storage[this.node._jnode_uid];
      
      if (this.node !== document) {
        var childs = this.childs();
        if (childs) childs.invoke('purge');
      }
      
      return this;
    }
  };
  
  if (typeof EL_DIV.insertAdjacentHTML === "function") {
    // supported in all browsers except firefox < 8
    JNode.prototype._insertString = function _insertString(content, pos) 
    { 
      switch (pos) {
        case 'before':
          pos = 'beforebegin';
          break;
          
        case 'top':
          pos = 'afterbegin';
          break;
          
        case 'after':
          pos = 'afterend';
          break;
          
        default:
          pos = 'beforeend';
      }
      
      this.node.insertAdjacentHTML(pos, content);
      return this;
    };
  }
  
  if (typeof EL_DIV.dataset === "undefined") {
    // MSIE 9 does not support .dataset, but data-xyz attributes
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
    // HTML5 classList polyfill
    JNode.prototype._classList = function _classList()
    {
      var node = this.node, self = this;
      
      function ts(c) { return c ? c.toString() : ""; }
      function cl() { self.classList.length = ts(node.className).split(" ").length; }
      
      this.classList = {
        length:   0,
        add:      function(name) { node.className += " " + name; cl(); },
        remove:   function(name) { node.className = ts(node.className).replace(new RegExp("\\b" + name + "\\b", "g"), ''); cl(); },
        contains: function(name) { return ts(node.className).match(new RegExp("\\b" + name + "\\b")) != null; },
        item:     function(index) { return (ts(node.className).split(" ") || [])[index]; },
        toggle:   function(a, b) { if (this.contains(a)) { this.remove(a); this.add(b); } else { this.remove(b); this.add(a); } cl(); }
      };
      
      cl();
    };
  }
  
  // ----------------------------------------------
  // node-list
  
  // class-body
  JNode.List = function JList(nodes)
  {
    // set constructor
    this.constructor = JList;
    
    function process(jlist, index, node)
    {
      jlist[index] = node;
    }
    
    // extend elements if necessary
    if (!(nodes instanceof Array)) {
      process = function(jlist, index, node)
      {
        jlist[index] = new JNode(node);
      }
    }
    
    for (var i = 0, l = nodes.length; i < l; ++i)
      process(this, i, nodes[i]);
      
    this.length = l;
  };
  
  // prototype
  JNode.List.prototype = {
    /**
     * calls a method on all nodes
     *
     * @param   String    method
     * @param   ...
     * @return  JNode.List
     */
    invoke: function invoke()
    {
      var args   = SLICE.call(arguments, 0),
          method = args.shift();
          
      for (var i = 0; i < this.length; ++i)
        this[i][method].apply(this[i], args);
        
      return this;
    },
    
    /**
     * collects properties from all nodes
     *
     * @param   String    prop
     * @return  Array
     */
    pluck: function pluck(prop)
    {
      var props = [];
      
      for (var i = 0; i < this.length; ++i)
        props.push(this[i].prop(prop));
        
      return props;
    },
    
    /**
     * alias for JNode.each
     *
     * @param   Function    func
     * @param   Object      context
     * @return  JNode.List
     */
    each: function each(func, context)
    {
      JNode.each(this, func, context);
      return this;
    },
    
    /**
     * filters elements
     *
     * @param   Function    func
     * @param   Object      context
     * @return  JNode.List
     */
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
  
  // ----------------------------------------------
  // storage
  
  // TODO: use sessionStorage
  
  JNode.Storage = {};
  
  /**
   * returns the global storage object
   *
   * @return    Object
   */
  JNode.getStorage = function getStorage()
  {
    if (!JNode.Storage[0])
      JNode.Storage[0] = {};
      
    return JNode.Storage[0];
  };
  
  /**
   * stores data in the global storage
   *
   * @param   String    needle
   * @param   Object    value
   * @void
   */
  JNode.store = function store(needle, value)
  {
    JNode.getStorage()[needle] = value;
  };
  
  /**
   * returns data from the global storage
   *
   * @param   String    needle
   * @param   Object    fallback
   * @return  mixed
   */
  JNode.fetch = function fetch(needle, fallback)
  {
    var storage = JNode.getStorage();
    
    if (!storage[needle])
      storage[needle] = fallback;
      
    return storage[needle];
  };
  
  /**
   * removes all event-handlers and deletes all storage-entries
   *
   * @void
   */
  JNode.purge = function purge()
  {
    JNode.release(window);
    delete JNode.Storage[0];
  };
  
  // ----------------------------------------------
  // event-handling
  
  (function() {
    // private
    var MOUSEENTER_LEAVE = ('onmouseleave' in EL_DIV && 'onmouseenter' in EL_DIV);
    
     // private
    function getRegistry(element) 
    {
      if (element === window)
        return JNode.fetch('_eventhandler', {});
        
      return new JNode(element).fetch('_eventhandler', {});
    }
    
    // private
    function createResponder(element, eventName, handler)
    {
      // handle mouseenter/leave
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
      
      // handle dom-event
      if (eventName.indexOf(":") == -1) {
        return function(event) { 
          handler.call(element, event || window.event); 
        };
      }
      
      // handle custom-event
      return function(event) {
        if (!event.eventName || event.eventName != eventName)
          return;
          
        handler.call(element, event || window.event);
      };
    }
    
    // private
    function register(element, eventName, handler, useCapture) 
    {
      var registry = getRegistry(element);
      
      if (!registry[eventName])
        registry[eventName] = [];
      else {
        // check all handlers and don't register the same again it again
        for (var i = 0, l = registry[eventName].length; i < l; ++i)
          if (registry[eventName].handler === handler 
           && registry[eventName].useCapture === useCapture)
            return;
      }
      
      var entry = {
        eventName:  eventName,
        handler:    handler,
        responder:  createResponder(element, eventName, handler),
        useCapture: useCapture      
      };
      
      registry[eventName].push(entry);
      return entry;
    }
    
    // internal
    function unregister(element, eventName, handler, useCapture) 
    {
      var registry = getRegistry(element);
      
      if (!registry[eventName])
        return null;
      
      for (var entry, i = 0, l = registry[eventName].length; i < l; ++i) {
        entry = registry[eventName][i];
        
        if (entry.handler === handler 
         && entry.useCapture === useCapture) {
          // remove this handler
          registry[eventName].splice(i, 1);
          return entry;
        }
      }
      
      return null;
    }
    
    // private
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
    
    // private
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
    
    // private
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
    
    // ----------------------------------------------
    
    /**
     * adds an event-listener to an element or the window-object
     *
     * @param   Element|Window    element
     * @param   String            eventName
     * @param   Function          handler
     * @param   Boolean           useCapture
     * @void
     */
    JNode.listen = function listen(element, eventName, handler, useCapture)
    {
      if (element instanceof JNode)
        element = element.node;
        
      useCapture = useCapture && useCapture === true ? useCapture : false;
      
      // dom:loaded | dom:ready -> DOMContentLoaded
      if (eventName === 'dom:loaded' || eventName === 'dom:ready') {
        // this only works if you use dom: ..., 
        // DOMContentLoaded has no special behaivor
        if (JNode.loaded === true) {
          // document is loaded. execute handler and return
          handler.call(element);
          return;
        }
        
        // override event-name
        eventName = 'DOMContentLoaded';
      }
      
      // register eventhandler
      var responder = register(element, eventName, handler, useCapture).responder;
      
      // handle DOM events
      if (eventName.indexOf(":") == -1) {
        // mouseenter/leave
        eventName = realEventName(eventName); 
        element.addEventListener(eventName, responder, useCapture);
        return;
      }
      
      // handle user defined events
      element.addEventListener("dataavailable", responder, useCapture);
    };
    
    /**
     * removes all/a specific event-listener
     *
     * @param   Element|Window    element
     * @param   String            eventName
     * @param   Function          handler
     * @param   Boolean           useCapture
     * @void
     */
    JNode.release = function release(element, eventName, handler, useCapture)
    {
      if (element instanceof JNode)
        element = element.node;
        
      if (typeof eventName == "boolean") {
        // assume that `eventName` is used as `useCapture`
        useCapture = eventName;
      } else if (typeof handler == "boolean") {
        // assume that `handler` is used as `useCapture`
        useCapture = handler;
      }
      
      var length = arguments.length;
      
      if (length === 1 || (length === 2 && typeof useCapture != "undefined")) {
        // remove all eventhandler
        releaseAll(element, useCapture);
        return;
      }
      
      if (length === 2 || (length === 3 && typeof useCapture != "undefined")) {
        // remove all eventhandler for the given type
        releaseType(element, eventName, useCapture);
        return;
      }
      
      // unregister eventhandler
      var responder = unregister(element, eventName, handler, useCapture);
      
      if (!responder || !responder.responder)
        return;
        
      responder = responder.responder;
      
      // handle DOM events
      if (eventName.indexOf(":") == -1) {
        eventName = realEventName(eventName);
        element.removeEventListener(eventName, responder, useCapture);
        return;
      }
      
      // handle user defined events
      element.removeEventListener("dataavailable", responder, useCapture);
    };
    
    /**
     * fires an event
     *
     * @param   Element|Window    element
     * @param   String            eventName
     * @param   Object            meta
     * @param   Boolean           bubble
     * @void
     */
    JNode.fire = function fire(element, type, meta, bubble) {
      bubble = bubble ? !!bubble : true;
      
      if (!meta) meta = {};
      
      var event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', bubble, true);
      
      event.eventName = type;
      event.meta = meta;
      
      element.dispatchEvent(event);
    };
    
    /**
     * this is just a wrapper for JNode.observe
     * 
     * @see     JNode.observe
     * @return  JNode
     */
    JNode.prototype.listen = function listen(eventName, handler, useCapture)
    {
      JNode.listen(this.node, eventName, handler, useCapture);
      return this;
    };
    
    /**
     * this is just a wrapper for JNode.stopObserving
     *
     * @see     JNode.stopObserving
     * @return  JNode
     */
    JNode.prototype.release = function release(eventName, handler, useCapture)
    {
      var args = SLICE.call(arguments);
      args.unshift(this.node);
      
      JNode.release.apply(null, args);
      return this;
    };
    
    /**
     * this is just a wrapper for JNode.fire
     *
     * @see     JNode.fire
     * @return  JNode
     */
    JNode.prototype.fire = function fire(eventName, useCapture)
    {
      JNode.fire(this.node, eventName, useCapture);
      return this;
    };
    
    // dom:loaded / dom:ready handler
    JNode.loaded = false;
    JNode.listen(document, 'DOMContentLoaded', function() { JNode.loaded = true; });
    
    // ------------------------------------------------
    
    // class body
    JNode.Event = function JEvent(event)
    {
      // set constructor
      this.constructor = JEvent;
    
      this.event = event;
      
      // allow hooks
      if (this.hook) this.hook();
    };
    
    // prototype
    JNode.Event.prototype = {
      /**
       * returns the target-element
       *
       * @return    JNode
       */
      element: function element()
      {
        var node = this.event.target || this.event.srcElement, 
            type = this.event.eventName;
             
        var currentTarget = this.event.currentTarget;

        if (currentTarget && currentTarget.tagName) {
          // Firefox screws up the "click" event when moving between radio buttons
          // via arrow keys. It also screws up the "load" and "error" events on images,
          // reporting the document as the target instead of the original image.
          if (type === 'load' || type === 'error' ||
            (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
              && currentTarget.type === 'radio'))
                node = currentTarget;
        }
        
        return new JNode(node);
      },
      
      /**
       * stops the event
       *
       * @return  JNode.Event
       */
      stop: function stop() 
      {
        this.event.preventDefault();
        this.event.stopPropagation();
        
        // mark event as stopped
        this.stopped = true;
        return this;
      },
      
      /**
       * JHP.Event->pointer() -> Object
       *
       * @return  Object
       */
      pointer: function pointer() 
      {
        return { 
          x: this.event.pageX, 
          y: this.event.pageY 
        };
      }
    };
  })(); 
  
  // ----------------------------------------------
  // ajax/jsonp
  
  // private
  var JSONP_CALLBACK_COUNTER = 0;
  
  // class-body
  JNode.Request = function JRequest(url, options)
  {
    // set constructor
    this.constructor = JRequest;
    
    this.url = url;
    this.options = { 
      method:       "post",
      data:         {},       // can be a File, FormData, Object or String
      async:        true,     // true/false
      jsonp:        '',       // if this is a function, JSONP will be used
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parseHtml:    false,    // if true, the responseText will be parsed as HTML
      
      // event-handler
      onSuccess:    JNode.noop,
      onFailure:    JNode.noop,
      onProgress:   JNode.noop,
      onUpload:     JNode.noop
    };
    
    JNode.each(options, function(v, k) { this.options[k] = v; }, this);
    
    this.method = this.options.method;
    this.request();
  };
  
  // prototype
  JNode.Request.prototype = {    
    /**
     * initializes the request
     *
     * @void
     */
    request: function request()
    {
      // JSONP
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
      
      // AJAX
      this.transport = new XMLHttpRequest;
      this.transport.open(this.method, this.url, this.options.async);
      
      // set request headers
      this.setRequestHeaders();
      
      var data = this.data;
      
      // prepare body
      if (this.method === 'post') {  
        if ((window.FormData && data instanceof FormData)
         || (window.File && data instanceof File)) {
          // add progress and upload listeners. 
          this.transport.upload.addEventListener('progress', this.options.onProgress);
          this.transport.upload.addEventListener('load', this.options.onUpload);
        } else {
          data = [];
          
          // generate key=value pairs
          JNode.each(this.options.data, function(v, k) { data.push(k + "=" + v); });
          data = data.join('&');
        }
      }
      
      // add load/error/abort listener
      try {
        this.transport.addEventListener('load', this.loaded.bind(this));
        this.transport.addEventListener('error', this.options.onFailure);
        this.transport.addEventListener('abort', this.options.onFailure);
      } catch (e) {
        // opera only supports "onload", "onerror", "onabort" properties.
        // and NO, i will not use "onreadystatechange"
        this.transport.onload = this.loaded.bind(this);
        this.transport.onerror = this.options.onFailure;
        this.transport.onabort = this.options.onFailure;
      }
      
      // send
      this.transport.send(data);
    },
    
    /**
     * handles the response
     *
     * @void
     */
    loaded: function loaded()
    {
      var res  = { text: '', json: null, xml: null }, 
          type = this.transport.getResponseHeader('Content-type');
      
      res.text = this.transport.responseText;
      
      // parse response
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
    },

    /**
     * sets all required request-headers
     *
     * @void
     */
    setRequestHeaders: function setRequestHeaders()
    {
      this.transport.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      this.transport.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*'); // notepad++ bug
      
      if (this.method === 'post')
        this.transport.setRequestHeader('Content-type', this.options.contentType
          + (this.options.encoding ? '; Charset=' + this.options.encoding : ''));
    }
  };
  
  /**
   * loads data via ajax and insert them into the node
   *
   * @param   String    url
   * @param   Object    options
   * @return  JNode
   */
  JNode.prototype.load = function load(url, options)
  {
    options.onSuccess = function(res) {
      this.update(res.text);
    }.bind(this);
    
    new JNode.Request(url, options);
    return this;
  }
  
  // ----------------------------------------------
  // effects
  
  // private
  var CSS_TRANSFORM = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
  
  // private
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
  
  /**
   * JNode Effect Animation Engine
   *
   * animates css-styles using css3-transitions/transforms/animations (if available)
   * ALL ARGUMENTS ARE REQUIRED
   *
   * you probably want to use .morph() instead, 
   * which sanitizes your arguments and forwards them properly to this method.
   *
   * @param   String      styles
   * @param   Number      duration
   * @param   Number      delay
   * @param   String      ease
   * @param   Function    callback
   * @return  JNode
   */
  JNode.prototype.anim = function anim(styles, duration, delay, ease, callback)
  {
    var tstyle = "", sstyle = "", endEvent, doc = new JNode(document);
    
    if (styles.indexOf(":") === -1) {
      // keyframe animation        
      endEvent = CSS_TRANSITION.aevent;
      tstyle = sstyle = CSS_TRANSITION.vendor + "animation:" + styles + " " 
        + duration + "s " + ease + " " + delay + "s";
    } else {
      // css transition
      var setter = {}, transf = ""; 
      endEvent = CSS_TRANSITION.tevent;
      
      for (var i = 0, s = styles.split(';'), l = s.length; i < l; ++i) {
        var split = s[i].split(':'), prop = split[0], val = split[1];
        
        if (!prop) continue;
        
        if (CSS_TRANSFORM.test(prop)) {
          transf += " " + prop + "(" + val + ")";
          continue;
        }
        
        // check if the given style-property has a value.
        // if not: use computed-style and set it as inline-style.
        var value = this.node.style.getPropertyValue(prop);
        
        if (value === "" || value === "auto")
          setter[prop] = this.style(prop);
          
        sstyle += ";" + prop + ':' + val;
      }
      
      // generate style
      tstyle = sstyle + ";" + CSS_TRANSITION.vendor 
        + "transition:all " + duration + "s " + ease + " " + delay + "s";
      
      if (setter) this.style(setter);
      if (transf) tstyle += ";" + CSS_TRANSITION.vendor + "transform:" + transf;
    }
    
    var handled = false, handler = function() {
      if (handled) return;
      doc.release(endEvent, handler, true);
      
      JNode.defer(function() {
        // remove animations
        var nstyle = this.node.style;
        nstyle.removeProperty(CSS_TRANSITION.vendor + "transition");
        nstyle.removeProperty(CSS_TRANSITION.vendor + "animation");
      
        JNode.defer(callback, this);
      }.bind(this));
      
      handled = true;
    }.bind(this);
    
    doc.listen(endEvent, handler, true);
    JNode.defer(function() { this.style(tstyle); }.bind(this));
    
    // force event, because no changes or to fast duration = no end-event (at least in firefox)
    // because upcomming effects may not function without clean-up
    // and you properly do not want to animatate ALL upcomming .style() changes after one failed effect.
    setTimeout(handler, (duration + 2) * 1000);
    return this;
  };
  
  if (!CSS_TRANSITION) {
    // MSIE9 does not support transitions, but transforms
    JNode.prototype.anim = function anim(styles, duration, delay, ease, callback)
    {
      // unused
      duration = delay = ease = void 0;
    
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
  
  /**
   * morph function-wrapper
   *
   * @param   String      styles
   * @param   Number      duration
   * @param   Number      delay
   * @param   String      ease
   * @param   Function    callback
   * @return  JNode
   */
  JNode.prototype.morph = function morph(styles, duration, delay, ease, callback)
  {
    // the last argument can always be the callback
    switch (arguments.length) {
      case 1:
        duration = .5;
        delay = 0;
        ease = "linear";
        callback = JNode.noop;
        break;
        
      case 2:
        if (typeof duration === "function") {
          callback = duration;
          duration = .5;
        }
        
        delay = 0;
        ease = "linear";
        break;
        
      case 3:
        if (typeof delay === "function") {
          callback = delay;
          delay = 0;
        }
        
        ease = "linear";
        break;
        
      case 4:
        if (typeof ease === "function") {
          callback = ease;
          ease = "linear";
        }
        
        break;
    }
    
    switch (duration) {
      case 'fast':
        duration = .1;
        break;
        
      case 'slow':
        duration = 5;
    }
    
    callback = callback || JNode.noop;    
    return this.anim(styles, duration, delay, ease, callback);
  }
  
  /**
   * fade-effect
   *
   * @param   Number|String   duration
   * @param   Function        callback
   * @return  JNode
   */
  JNode.prototype.fade = function fade(duration, callback) 
  {
    var args = SLICE.call(arguments, 0);
    args.unshift("opacity:0");
    
    switch (args.length) {
      case 1:
        args.push(function(node) { node.hide(); });
        break;
        
      default:
        var wrap = JNode.noop, hasc = false;
        if (typeof args[args.length - 1] === "function") {
          hasc = true;
          wrap = args[args.length - 1];
        }
        
        wrap = (function(c) { return function(n) { n.hide(); c(n); } })(wrap);
        
        if (hasc) args[args.length - 1] = wrap;
        else args.push(wrap);
    }
    
    this.style("opacity:1");
    return this.morph.apply(this, args);
  };
  
  /**
   * appear-effect
   *
   * @param   Number|String   duration
   * @param   Function        callback
   * @return  JNode
   */
  JNode.prototype.appear = function appear(duration, callback) 
  {
    var args = SLICE.call(arguments, 0);
    args.unshift("opacity:1");
    
    this.style("opacity:0;").show();
    return this.morph.apply(this, args);
  };
  
  // ----------------------------------------------
  // static
  
  // private
  var RX_EL_ID   = /^(\w+)?#([\w:]+)$/,
      RX_EL_NAME = /^[a-zA-Z]+$/,
      RX_EL_FIX  = /^(?:body|head)$/i;
  
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
    if (context === true) {
      first   = true;
      context = null;
    }
    
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
               || html.webkitMatchesSelector || html.msMatchesSelector
               || html.oMatchesSelector;
    
    if (!matches) {
      // MobileWebkit
      JNode.match = function match(expr, node) 
      { 
        var reset = false;
        
        if (!node.parentNode) {
          reset = node.style.display;
          node.style.display = 'none';
          document.body.appendChild(node); // reflow + repaint
        }
        
        var matches = SLICE.call(node.parentNode.querySelectorAll(expr), 0).indexOf(node) !== -1;
        
        if (reset !== false) {
          document.body.removeChild(node); // reflow + repaint
          node.style.display = reset;
        }
        
        return matches;
      };
      
      return;
    }
    
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
      
      // MSIE 9
      if (disconnectedMatch && !node.parentNode) {
        // VERY SLOW, but this is the only way to emulate the expected behaivor
        var parentNode = new JNode("div");
        parentNode.style("display:none;position:absolute;top:-100px;left:-100px").append(document.body); // reflow + repaint
        parentNode.insert(node.cloneNode(true)); // reflow + repaint
        
        var res = JNode.match(expr, node);
        parentNode.remove(); // reflow + repaint
        
        return res;
      }
      
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
      
      var e = document.getElementById(indicator);
      return e ? new JNode(e) : null;
    }
      
    var nodes = [];
    
    for (var i = 0, r, l = arguments.length; i < l; ++i)
      if ((r = init(arguments[i])) !== null) 
        nodes.push(res);
       
    return nodes ? new JNode.List(nodes) : null;
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
    // faster than func.call in iteration-body
    context && (func = func.bind(context));
    
    // native array or array-like
    if (Array.isArray(object) || object.length != void 0) {
      for (var i = 0, l = object.length; i < l; ++i)
        if (false === func(object[i], i, object))
          break;
        
      return;
    }
    
    // object
    var keys = Object.keys(object);
    
    for (var i = 0, k, l = keys.length; i < l; ++i)
      if (false === func(object[k = keys[i]], k, object))
        break;
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
  
  /**
   * no-conflict mode
   *
   * @return  Object
   */
  JNode.noConflict = function noConflict() 
  {
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

// polyfill for MobileWebkit
(function() {
  if (typeof Function.prototype.bind == "function")
    return; // nothing to do here (javascript 1.8.6)
    
  // private
  function polyfill(object, methods) 
  {
    for (var i in methods)
      if ((i in methods) && typeof object[i] === "undefined")
        object[i] = methods[i];
  }
  
  // taken from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects
  
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
        // closest thing possible to the ECMAScript 5 internal IsCallable function  
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

