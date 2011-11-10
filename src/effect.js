(function() {
  /** @private */
  var CSS_TRANSFORM = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
  
  /** @private */
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
    
    /** @private */
    function mkevent(name) { return prefix ? prefix + name : name.toLowerCase(); }
      
    return {  
      "vendor": vendor,
      "tevent": mkevent("TransitionEnd"),
      "aevent": mkevent("AnimationEnd")
    };
  })();
  
  /** @private */
  var DURATION_TRANSLATION = { "fast": .2, "slow": 2, "instant": .1, "default": .5 };
  
  /** @private */
  var ANIM_DEFAULT_OPTIONS = { duration: .5, delay: 0, ease: 'linear' };
  
  /** @private */
  function isNumOrStr(obj) {
    return (["number", "string"].indexOf(typeof obj) > -1);
  }
  
  /** @private */
  function getDuration(duration) {
    if (isNaN(duration))
      return DURATION_TRANSLATION[duration] || .5;
      
    return duration;
  }
  
  /** @private */
  function useDelay(options, func) {
    if (options.delay) {
      var delay = options.delay;
      options.delay = 0;
      
      setTimeout(func.bind(func), delay * 1000);
      return;
    }
    
    func();
  }
  
  /**
   * Animiert CSS-Eigenschaften mithilfe von CSS3-Transitions/Transforms und Animationen.
   *
   * @param     {String}      styles
   * @param     {Object}      options
   * @param     {Function}    callback
   * @returns   {JNode}
   */
  JNode.prototype.anim = function anim(styles, options, callback)
  {
    var tstyle = "", sstyle = "", endEvent, doc = new JNode(document);
    
    if (typeof options === "function")
      callback = options, options = {};
    
    options = JNode.merge(ANIM_DEFAULT_OPTIONS, options || {});
    options.duration = getDuration(options.duration);
    
    if (styles.indexOf(":") === -1) {
      // keyframe animation        
      endEvent = CSS_TRANSITION.aevent;
      tstyle = sstyle = CSS_TRANSITION.vendor + "animation:" + styles + " " 
        + options.duration + "s " + options.ease + " " + options.delay + "s";
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
        
        // https://bugzilla.mozilla.org/show_bug.cgi?id=571344
        var value = this.node.style.getPropertyValue(prop);
        
        if (value === "" || value === "auto")
          setter[prop] = this.style(prop);
          
        sstyle += ";" + prop + ':' + val;
      }
      
      // generate style
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
        // remove animations
        var nstyle = this.node.style;
        nstyle.removeProperty(CSS_TRANSITION.vendor + "transition");
        nstyle.removeProperty(CSS_TRANSITION.vendor + "animation");
      
        callback && JNode.defer(callback, this);
      }.bind(this));
      
      handled = true;
    }.bind(this);
    
    // doc.one(endEvent, handler, true)
    doc.listen(endEvent, handler, true);
    JNode.defer(function() { this.style(tstyle); }.bind(this));
    
    // ausführung erzwingen, da es in manchen fällen vorkommen kann, dass
    // der handler nicht ausgeführt wird.
    setTimeout(handler, ((options.duration || .1) + 2) * 1000);
    return this;
  };
  
  if (!CSS_TRANSITION) {
    // MSIE9 unterstützt keine CSS3-Transitions, aber CSS3-Transforms
    JNode.prototype.anim = function anim(styles, unused, callback)
    {
      // unused :-D
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
  
  /*
  TODO: keep this DRY
  
  if (typeof options === "function")
    callback = options, options = {};
    
  options || (options = {});
  
  if (isNumOrStr(options))
    options = { duration: options }; 
  */
  
  /**
   * Fade-Effekt
   *
   * @param     {Number|String}   options
   * @param     {Function}        callback
   * @returns   {JNode}
   */
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

  /**
   * Appear-Effekt
   *
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
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

  /**
   * Verpuffungs-Effekt
   *
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
  JNode.prototype.puff = function puff(options, callback)
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
      
    return this.anim("opacity:0;scale:4;position:absolute", options, callback);
  };
  
  /**
   * Zusammenfalt-Effekt
   *
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
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
  
  /**
   * Blind-Effekt
   *
   * @param     {String}                  dir
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
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
  
  /**
   * Shrink-Effekt
   *
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
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
  
  /**
   * Grow-Effekt
   *
   * @param     {Number|String|Object}    options
   * @param     {Function}                callback
   * @returns   {JNode}
   */
  JNode.prototype.grow = function grow(options, callback)
  {
    if (typeof options === "function")
      callback = options, options = {};
      
    options || (options = {});
    
    if (isNumOrStr(options))
      options = { duration: options };
      
    this.show();
    
    // wait for a repaint/reflow
    JNode.defer(function() { this.anim("scale:1", options, callback); }.bind(this));
    return this;
  };
})();
