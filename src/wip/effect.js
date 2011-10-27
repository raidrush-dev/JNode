(function(JNODE) {
  // private
  var div = document.createElement("div");
  
  // private
  var VENDOR = (function() {
    var props = [
      // vendor            // testing-property                  // event
      { vendor: '-moz',    prop: '-moz-transition-property',    event: 'transitionend' }, 
      { vendor: '-webkit', prop: '-webkit-transition-property', event: 'WebkitTransitionEnd' }, 
      { vendor: '-o',      prop: '-o-transition-property',      event: 'oTransitionEnd' }, 
      { vendor: '-ms',     prop: '-ms-transition-property',     event: 'msTransitionEnd' }, // unknown 
      { vendor: '',        prop: 'transition-property',         event: 'transitionend' }
    ];
    
    for (var i = 0, l = props.length; i < l; ++i) {
      div.style.cssText = props[i].prop + ": height;";
      if (div.style.cssText.indexOf(props[i].prop) > -1)
        return { prefix: props[i].vendor, event: props[i].event };
        
      div.style.cssText = '';
    }
    
    return false;
  })();
  
  div = null;
  
  // private
  function v(prop) { return VENDOR.prefix ? VENDOR.prefix + "-" + prop : prop; }
  
  /**
   * morphs css-styles using css3-transitions (if available)
   *
   * @param   String          styles
   * @param   Number|String   duration
   * @param   Function        callback
   * @return  JNode
   */
  JNode.prototype.morph = function morph(styles, duration, callback)
  {
    callback = (typeof callback == "function") ? callback : JNode.noop;
    duration = duration || .5;
    
    switch (duration) {
      case 'fast':
        duration = .2;
        break;
        
      case 'slow':
        duration = 5;
        break;
    }
    
    // fallback
    if (VENDOR === false) {
      this.prop('style').cssText += ";" + options.style;
      JNode.defer(callback);
      return;
    }
    
    // let the browser decide
    var properties = [];
    
    for (var i = 0, s = styles.split(';'), l = s.length; i < l; ++i) {
      var prop = s[i].split(':');
      properties.push(prop[0]);
    }
    
    properties = properties.join(',');
    
    // set height and width
    if (!this.node.style.width || !this.node.style.height)
      this.style({ width: this.style('width'), height: this.style('height') });
    
    var oldStyle = this.prop('style').cssText + ";" + styles,
        newStyle = oldStyle + ";"
              + v('transition-property') + ":" + properties + ";"
              + v('transition-duration') + ":" + duration + "s;";  
    
    var handler = function() {
      $(document).release(VENDOR.event, handler, true);
      
      JNode.defer(
        function() {
          // remove transition-properties
          this.prop('style').cssText = oldStyle;
          JNode.defer(callback);
        }.bind(this)
      );
      
    }.bind(this);
    
    $(document).listen(VENDOR.event, handler, true);
    JNode.defer(function() { this.prop('style').cssText = newStyle; }.bind(this));
    return this;
  }
  
  /**
   * fade-effect
   *
   * @param   NUmber|String   duration
   * @param   Function        callback
   * @return  JNode
   */
  JNode.prototype.fade = function fade(duration, callback) 
  {
    return this.morph('opacity:0', duration, callback);
  };
  
  /**
   * appear-effect
   *
   * @param   NUmber|String   duration
   * @param   Function        callback
   * @return  JNode
   */
  JNode.prototype.appear = function appear(duration, callback) 
  {
    return this.morph('opacity:1', duration, callback);
  };
})(JNode);