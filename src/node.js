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

