/** @private */
var JSONP_CALLBACK_COUNTER = 0;

/**
 * JNode.Request
 *
 * @class
 * @param       {String}    url
 * @param       {Object}    options
 * @constructor
 */
JNode.Request = function JRequest(url, options)
{
  this.constructor = JRequest;
  
  /** 
   * Ajax/JSONP URL
   *
   * @field 
   */
  this.url = url;
  
  /** 
   * AJAX/JSONP Optionen
   *
   * @field 
   */
  this.options = JNode.merge({ 
    method:       "post",
    data:         {}, 
    async:        true,
    jsonp:        null,
    contentType:  'application/x-www-form-urlencoded',
    encoding:     'UTF-8',
    parseHtml:    false,
    
    // event-handler
    onSuccess:    JNode.noop,
    onFailure:    JNode.noop,
    onProgress:   JNode.noop,
    onUpload:     JNode.noop
  }, options || {});
  
  /** 
   * AJAX Anfragemethode
   * 
   * @field 
   */
  this.method = this.options.method;
  this.request();
};

// JSONP default paramname
JNode.Request.JSONP_DEFAULT = 'jsonp';

// prototype
JNode.Request.prototype = {    
  /**
   * Initialisiert die Anfrage
   *
   */
  request: function request()
  {
    // JSONP
    if (this.options.jsonp) {
      var jsonp = '_jnode_jsonp_ref_' + JSONP_CALLBACK_COUNTER++;
      window[jsonp] = this.options.onSuccess;
      
      var param = this.options.jsonp;
      if (typeof param !== "string")
        param = JNode.Request.JSONP_DEFAULT;
      
      var url = this.url;
      url += (url.indexOf('?') == -1 ? '?' : '&') + param + '=' + jsonp;
      
      var script = new JNode('script');
      script.attr({ type: 'text/javascript', src: url });
      
      script.listen("load", function() { 
        JNode.defer(function() {
          script.remove();
          delete window[jsonp];
        });
      });
      
      var failure = function() {
        JNode.defer(function() {
          script.remove();
          delete window[jsonp];
          this.options.onFailure();
        }.bind(this));
      }.bind(this);
      
      script.listen("error", failure)
        .listen("abort", failure)
        .append(document.body);  
        
      return;
    }
    
    // AJAX
    /** 
     * XMLHttpRequest Instanz
     *
     * @field 
     */
    this.transport = new XMLHttpRequest;
    this.transport.open(this.method, this.url, this.options.async);
    
    // set request headers
    this.transport.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    this.transport.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*'); // notepad++ bug
    
    var data = this.options.data;
    
    // prepare body
    if (this.method === 'post') {  
      this.transport.setRequestHeader('Content-type', this.options.contentType
        + (this.options.encoding ? '; Charset=' + this.options.encoding : ''));
        
      if ((window.FormData && data instanceof FormData)
       || (window.File && data instanceof File)) {
        try {
          this.transport.upload.addEventListener('progress', this.options.onProgress);
          this.transport.upload.addEventListener('load', this.options.onUpload);
        } catch (e) {
          // XMLHttpRequest Level 2
          // Nicht verfügbar in Opera und MSIE
          // In Opera vermutlich in Zukunft (wieder) implementiert
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
      // Opera untersützt nur "onload", "onerror", "onabort"
      this.transport.onload = this.loaded.bind(this);
      this.transport.onerror = this.options.onFailure;
      this.transport.onabort = this.options.onFailure;
    }
    
    // send
    this.transport.send(data);
  },
  
  /**
   * Verarbeitet die Serverantwort
   *
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
  } 
};

/**
 * Läd über AJAX/JSONP Daten und fügt diese direkt in das aktuelle Element ein.
 *
 * @param     {String}    url
 * @param     {Object}    options
 * @returns   {JNode}
 */
JNode.prototype.load = function load(url, options)
{
  options || (options = {});
  
  /** @private */
  options.onSuccess = function(res) {
    this.update(res.text);
  }.bind(this);
  
  new JNode.Request(url, options);
  return this;
};
