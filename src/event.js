(function() {
  /** @private */
  var MOUSEENTER_LEAVE = ('onmouseleave' in EL_DIV && 'onmouseenter' in EL_DIV);
  
  /** @private */
  function getRegistry(element) 
  {
    if (element === window)
      return JNode.fetch('_eventhandler', {});
      
    return new JNode(element).fetch('_eventhandler', {});
  }
  
  /** @private */
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
  
  /** @private */
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
  
  /** @private */
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
  
  /** @private */
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
  
  /** @private */
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
  
  /** @private */
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
   * Fügt einen Event-Handler hinzu
   *
   * @event
   * @static
   * @param     {Element|Window}    element
   * @param     {String}            eventName
   * @param     {Function}          handler
   * @param     {Boolean}           useCapture
   * @param     {Boolean}           once
   */
  JNode.listen = function listen(element, eventName, handler, useCapture, once)
  {
    if (element instanceof JNode)
      element = element.node;
      
    useCapture = useCapture && useCapture === true;
    
    // dom:loaded | dom:ready -> DOMContentLoaded
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
  
  /**
   * Registriert einen listener für den angegebenen Event und entfernt diesen
   * wenn der Event zum ersten mal ausgelöst wurde.
   *
   * @event
   * @static
   * @see       JNode.listen()
   * @param     {Element|Window}    element
   * @param     {String}            eventName
   * @param     {Function}          handler
   * @param     {Boolean}           useCapture
   */
  JNode.one = function one(element, eventName, handler, useCapture)
  {     
    JNode.listen(element, eventName, handler, useCapture, true);
  };  
  
  /**
   * Entfernt einen Event-Handler
   *
   * @event
   * @static
   * @param     {Element|Window}    element
   * @param     {String}            eventName
   * @param     {Function}          handler
   * @param     {Boolean}           useCapture
   */
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
  
  /**
   * Feuert einen Benutzerevent
   *
   * @event
   * @static
   * @param     {Element|Window}    element
   * @param     {String}            eventName
   * @param     {Object}            meta
   * @param     {Boolean}           bubble
   */
  JNode.fire = function fire(element, eventName, meta, bubble) {
    bubble = bubble ? !!bubble : true;
    
    if (!meta) meta = {};
    
    var event = document.createEvent('HTMLEvents');
    event.initEvent('dataavailable', bubble, true);
    
    event.eventName = eventName;
    event.meta = meta;
    
    element.dispatchEvent(event);
  };
  
  /**
   * Entspricht JNode.listen(), bezieht sich aber auf das aktuelle Element
   * 
   * @event
   * @see       JNode.observe
   * @returns   {JNode}
   */
  JNode.prototype.listen = function listen(eventName, handler, useCapture)
  {
    JNode.listen(this.node, eventName, handler, useCapture);
    return this;
  };
  
  /**
   * Entspricht JNode.one(), bezieht sich aber auf das aktuelle Element
   *
   * @event
   * @see       JNode.one
   * @returns   {JNode}
   */
  JNode.prototype.one = function one(eventName, handler, useCapture)
  {
    JNode.one(this.node, eventName, handler, useCapture);
    return this;
  };
  
  /**
   * Entspricht JNode.release(), bezieht sich aber auf das aktuelle Element
   *
   * @event
   * @see       JNode.release
   * @returns   {JNode}
   */
  JNode.prototype.release = function release(eventName, handler, useCapture)
  {
    var args = SLICE.call(arguments);
    args.unshift(this.node);
    
    JNode.release.apply(null, args);
    return this;
  };
  
  /**
   * Entspricht JNode.fire(), bezieht sich aber auf das aktuelle Element
   *
   * @event
   * @see       JNode.fire
   * @returns   {JNode}
   */
  JNode.prototype.fire = function fire(eventName, meta, bubble)
  {
    JNode.fire(this.node, eventName, meta, bubble);
    return this;
  };
  
  JNode.loaded = false;
  JNode.listen(document, 'DOMContentLoaded', function() { JNode.loaded = true; });
  
  // ------------------------------------------------
  
  /**
   * JNode.Event
   *
   * @class
   * @param         {Event}     event
   * @constructor
   */
  JNode.Event = function JEvent(event)
  {
    this.constructor = JEvent;
    
    /**
     * Originaler Event
     *
     * @field
     */
    this.event = event;
    
    /**
     * Speichert ob der aktuelle Event gestoppt wurde
     *
     * @field
     */
    this.stopped = false;
    
    // hooks ausführen
    if (this.hook) this.hook();
  };
  
  // prototype
  JNode.Event.prototype = {
    /**
     * Gibt das Ziel-Element zurück
     *
     * @returns   {JNode}
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
     * Stoppt den Event
     *
     * @returns   {JNode.Event}
     */
    stop: function stop() 
    {
      this.event.preventDefault();
      this.event.stopPropagation();
      
      this.stopped = true;
      return this;
    },
    
    /**
     * Gibt die aktuelle Mauszeigerposition zurück
     *
     * @returns   {Object}
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
