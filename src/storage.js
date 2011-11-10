// TODO: use sessionStorage

/**
 * In diesem Objeckt werden alle Daten gespeichert die per 
 * JNode#store() oder JNode.store() hinzugefügt wruden.
 *
 * @static
 */
JNode.Storage = {};

/**
 * Gibt das globale Storage-Objekt zurück (bezieht sich auf `window`).
 *
 * @static
 * @returns   {Object}
 */
JNode.getStorage = function getStorage()
{
  if (!JNode.Storage[0])
    JNode.Storage[0] = {};
    
  return JNode.Storage[0];
};

/**
 * Speichert Daten im globalen Storage-Objekt
 *
 * @static
 * @param     {String}    needle
 * @param     {Object}    value
 */
JNode.store = function store(needle, value)
{
  JNode.getStorage()[needle] = value;
};

/**
 * Gibt daten aus dem globalen Storage-Objekt zurück.
 *
 * @static
 * @param     {String}    needle
 * @param     {Object}    fallback
 * @returns   {Object}
 */
JNode.fetch = function fetch(needle, fallback)
{
  var storage = JNode.getStorage();
  
  if (!storage[needle])
    storage[needle] = fallback;
    
  return storage[needle];
};

/**
 * Entfernt alle Events und löscht alle Daten des globalen Storage-Objekts
 *
 * @static
 */
JNode.purge = function purge()
{
  JNode.release(window);
  delete JNode.Storage[0];
};

/**
 * Erstellt und gibt das Storage-Objekt für dieses Element zurück.
 *
 * @returns   {Object}
 */
JNode.prototype.getStorage = function getStorage()
{
  var uid;
  
  if (!this.node._jnode_uid) {
    if (this.node === document)
      uid = 1;
    else {
      if (this.node.uniqueID)
        uid = this.node.uniqueID;
      else
        uid = ++STORAGE_ID_COUNTER;
        
      this.node._jnode_uid = uid;
    }
  } else 
    uid = this.node._jnode_uid;
  
  if (!JNode.Storage[uid])
    JNode.Storage[uid] = {};
    
  return JNode.Storage[uid];
};

/**
 * Speichert Daten im Storage-Objekt
 *
 * @param     {String}    needle
 * @param     {Object}    value
 * @returns   {JNode}
 */
JNode.prototype.store = function store(needle, value)
{
  var storage = this.getStorage();
  storage[needle] = value;
  
  return this;
};

/**
 * Gibt ein gespeichertes Objekt zurück.
 *
 * @param     {String}            needle
 * @param     {Object}            fallback
 * @returns   {Object|undefined}
 */
JNode.prototype.fetch = function fetch(needle, fallback)
{
  var storage = this.getStorage();
  
  if (!storage[needle])
    storage[needle] = fallback;
    
  return storage[needle];
};

/**
 * Entfernt alle Events und löscht alle gespeicherten Daten im Storage-Objekt
 *
 * @returns   {JNode}
 */
JNode.prototype.purge = function purge()
{
  JNode.release(this.node);
  
  if (this.node._jnode_uid)
    delete JNode.Storage[this.node._jnode_uid];
  
  if (this.node !== document) {
    var childs = this.childs(true);
    if (childs) childs.invoke('purge');
  }
  
  return this;
};

