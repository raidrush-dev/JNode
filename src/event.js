(function() {
  // private
  var MOUSEENTER_LEAVE = ('onmouseleave' in EL_DIV && 'onmouseenter' in EL_DIV);
  
   // private
  function getRegistry(element) {
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
  function releaseAll(element, useCapture) {
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
          
        JNode.stopObserving(element, name, registry[name][i2].handler, useCapture);
      } 
    }
  }
  
  // private
  function releaseType(element, eventName, useCapture) {
    var registry = getRegistry(element)[eventName] || [],
        capture  = useCapture ? !!useCapture : null;
        
    for (var i = 0, l = registry.length; i < l; ++i) {
      var useCapture = capture;
      
      if (useCapture === null)
        useCapture = registry[i].useCapture;
      else if(useCapture !== registry[i].useCapture)
        continue;
      
      JNode.stopObserving(element, eventName, registry[i].handler, useCapture);
    }
  }
  
  // ----------------------------------------------
  // exports
  
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

