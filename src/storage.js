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
  JNode.stopObserving(window);
  
  var storage = JNode.getStorage();
  storage = {};
};

