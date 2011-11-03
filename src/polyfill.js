/** @private */
(function() {
  if (typeof Function.prototype.bind == "function")
    return; // nothing to do here (javascript 1.8.6)
    
  /** @private */
  function polyfill(object, methods) 
  {
    for (var i in methods)
      if ((i in methods) && typeof object[i] === "undefined")
        object[i] = methods[i];
  }
  
  // taken from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects
  
  polyfill(Object, {
    /** @private */
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
    /** @private */
    isArray: function isArray(object) 
    {
      return object instanceof Array;
    }
  });
  
  polyfill(Array.prototype, {
    /** @private */
    forEach: function forEach(func, context) 
    {
      for (var i = 0, l = this.length >>> 0; i < l; ++i)
        func.call(context || null, this[i], i, this);
    },
    
    /** @private */
    indexOf: function indexOf(val) 
    {
      for (var i = 0, l = this.length >>> 0; i < l; ++i)
        if (val === this[i])
          return i;
          
      return -1;
    },
    
    /** @private */
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
    
    /** @private */
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
    /** @private */
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

