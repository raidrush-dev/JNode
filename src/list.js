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

