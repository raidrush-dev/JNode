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
    user:         '',       // url login username
    password:     '',       // url login password
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
  
  this.method = options.method;
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
      
      var url = this.options.url;
      url += (url.indexOf('?') == -1 ? '?' : '&') + 'jsonp=' + jsonp;
      
      var script = new JNode('script');
      script.attr({ type: 'text/javascript', src: url });
      
      // eval, exec onSuccess and return
      script.append(document.body);
      
      JNode.defer(function() {
        delete window[jsonp];
        this.options.onSuccess();
      }.bind(this));
      
      return;
    }
    
    // AJAX
    this.transport = new XMLHttpRequest;
    this.transport.open(this.method, this.url, this.options.async, 
      this.options.user, this.options.password);
    
    // set request headers
    this.setRequestHeaders();
    
    var data = this.data;
    
    // prepare body
    if (this.method === 'post') {  
      if (data instanceof FormData 
       || data instanceof File) {
        // add progress and upload listeners
        this.transport.upload.addEventListener('progress', this.options.onProgress);
        this.transport.upload.addEventListener('load', this.options.onUpload);
      } else {
        data = [];
        
        // generate key=value pairs
        JNode.each(this.data, function(v, k) { data.push(k + "=" + v); });
        data = data.join('&');
      }
    }
    
    // add load/error/abort listener
    this.transport.addEventListener('load', this.loaded.bind(this));
    this.transport.addEventListener('error', this.options.onFailure);
    this.transport.addEventListener('abort', this.options.onFailure);
    
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
      this.onSuccess(res);
      return;
    }
    
    this.onFailure(res);
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

