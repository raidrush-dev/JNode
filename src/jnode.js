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
    
    // set attributes if available
    if (attr) this.attr(attr);
  }

  // prototype
  JNode.prototype = {
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
        
      JNOde.each(needle, function(v, k) {
        this.node.setAttribute(k, v);
      });
      
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
        this.node.style.cssText += ";" + needle + ":" + value;
        return this;
      }
      
      if (typeof needle == "string") {
        if (needle.indexOf(":") > -1) {
          this.node.style.cssText += ';' + needle;
          return this;
        }
      
        return document.defaultView
          .getComputedStyle(this.node, null)
          .getPropertyValue(needle);
      }
      
      var expr = "";
      for (var k in needle)
        expr += ";" + k + ":" + needle[k];
        
      this.node.style.cssText += expr;
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
        this.node.dataset[needle] = false;
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
      this.node.parentNode.removeChild(this.node);
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
      selector = selector || "> *";        
      return JNode.find(selector, this.node, true);
    },
    
    /**
     * return tue if the given selector would match this node
     *
     * @param   String    selector
     * @return  Boolean
     */
    match: function match(selector)
    {
      // TODO: use INSERTIONS
      
      var wrapper = EL_DIV.cloneNode(true);
      wrapper.appendChild(this.node.cloneNode(true));
      
      return (JNode.find(selector, wrapper, true) !== null);
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
        
        while (--selector && $.isElement(p))
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
      else if (!(data instanceof Node) && !(data instanceof NodeList) && !Array.isArray(data))
        return this._insertString(data, pos);
      
      // grab method
      var mth = INSERTION[pos] || INSERTION['bottom'];
      
      if (!Array.isArray(data) && !(data instanceof NodeList)) {
        // must be an element
        mth(this.node, data);
        return this;
      }
      
      if (pos === 'top' || pos === 'after') 
        data.reverse();
      
      //for each(var node in data)
      for (var i = 0, node; node = data[i]; ++i) 
        mth(this.node, node);
      
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
        this.innerHTML = '';
        return this.insert(content);
      }
      
      this.innerHTML = content;
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
          var uid = this.node === document ? 0 
            : this.node.uniqueID || ++STORAGE_ID_COUNTER;
            
          this.node._jnode_uid = uid;
        }
      }
      
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
      this.getStorage()[needle] = value;
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
      
      var storage = this.getStorage();
      storage = null;
      
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
    
    var storage = JNode.getStorage();
    storage = {};
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
      
      if (!responder.responder)
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
      JNode.release(this.node, eventName, handler, useCapture);
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
