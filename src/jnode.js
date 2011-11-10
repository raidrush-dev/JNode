/*!
 * JNode: Leichtgewicht JavaScript/DOM Framework für moderne Browser - Version 0.0.1a2
 * Copyright 2011 murdoc <murdoc@raidrush.org>
 *
 * This library is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 */
 
"use strict";

//@require polyfill.js

/**
 * JNode
 *
 * @class
 * @param       {String}    tag
 * @param       {Object}    attr
 * @constructor
 *
 */
var JNode = (function() {
  /** @private */
  var EL_DIV = document.createElement('div');
  
  /** @private */
  var CONTAINERS = {
    'tbody':  'table',
    'tfoot':  'table',
    'thead':  'table',
    'tr':     'tbody',
    'th':     'tr',
    'td':     'tr',
    '*':      'div'
  };

  /** @private */
  var INSERTION = {
    /** @private */
    before: function(element, node) {
      element.parentNode.insertBefore(node, element);
    },
    /** @private */
    top: function(element, node) {
      element.insertBefore(node, element.firstChild);
    },
    /** @private */
    bottom: function(element, node) {
      element.appendChild(node);
    },
    /** @private */
    after: function(element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    },
    
    // used to generate HTML-nodes from a string
    tags: {
      TABLE:  ['<table>',                '</table>',                   1],
      TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
      TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TH:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
      SELECT: ['<select>',               '</select>',                  1],
      LI:     ['<ul>',                   '</ul>',                      1],
      DT:     ['<dl>',                   '</dl>',                      1],
      DD:     ['<dl>',                   '</dl>',                      1]
    }
  };
  
  /** @private */
  var SLICE = Array.prototype.slice;
  
  /** @private */
  var EMPTY_ARRAY = [];
  
  /** @private */
  var ANON_ID_COUNTER = 0;
  
  /** @private */
  var STORAGE_ID_COUNTER = 10;
  
  // ----------------------------------------------
  
  /** @private */
  function fragment(html) 
  {
    var name = ((html = html.trim()).match(/^\<([^\s>]+)/) || [0, '*'])[1].toLowerCase();
    
    if (!CONTAINERS[name])
      name = '*';

    var parent = document.createElement(CONTAINERS[name]);
    parent.innerHTML = html;
    
    if (parent.firstChild && parent.firstChild.nextSibling)
      // alle elemente zurückgeben inkl. eltern-element
      return parent;
      
    // nur die generierten elemente (firstChild) zurückgeben
    var element = parent.childNodes[0].cloneNode(true);
    
    // speicher freigeben
    parent = null;
    return element;
  }
  
  // ----------------------------------------------
  // TODO: Node <> Element
  
  /** @private */
  function JNode(tag, attr) 
  {   
    this.constructor = JNode;
    
    // node erstellen
    this.node = (tag instanceof Node || tag === document) // tag ist bereits ein element
      ? tag : (tag instanceof JNode) // jnode-object
        ? tag.node : (tag.substr(0, 1) !== '<') // tag oder html
          ? document.createElement(tag) : fragment(tag);
    
    // hooks ausführen
    if (this.hook) this.hook();
    
    // HTML5 classList polyfill
    this._classList();
    
    // attribute setzen
    if (attr) this.attr(attr);
  }

  // prototype
  JNode.prototype = {
    /** @private */
    _classList: function _classList() {
      /**
       * HTML5 classList
       *
       * @field
       */
      this.classList = this.prop('classList');
    },
    
    /**
     * Entfernt eine Klasse
     *
     * @param     {String|RegExp}   name
     * @returns   {JNode}
     */
    removeClass: function removeClass(name)
    {
      if (name instanceof RegExp) {
        var klass = [];
        
        JNode.each(String(this.prop('className')).split(" "), 
          function(c) {
            if (!c.match(name))
              klass.push(c);
          }
        );        
        
        this.prop('className', klass.join(" "));        
        return this;
      }
      
      this.classList.remove(name);
      return this;
    },
    
    /**
     * Fügt eine Klasse hinzu
     *
     * @param     {String}          name
     * @returns   {JNode}
     */
    addClass: function addClass(name)
    {
      this.classList.add(name);
      return this;
    },
    
    /**
     * Überschreibt alle Klassen mit der Angegebenen
     *
     * @param     {String}          name
     * @returns   {JNode}
     */
    setClass: function setClass(name) 
    {
      this.prop('className', name);
      return this;
    },
    
    /**
     * Prüft ob das akuelle Element eine bestimmte Klasse besitzt.
     *
     * @param     {String}          name
     * @returns   {Boolean}
     */
    hasClass: function hasClass(name)
    {
      return this.classList.contains(name);
    },
    
    /**
     * Fügt eine Klasse hinzu, falls diese nicht bereits exisitiert.
     * Andernfalls wird diese entfernt.
     *
     * @param     {String}          name
     * @returns   {JNode}
     */
    toggleClass: function toggleClass(name)
    {
      this.classList.toggle(name);
      return this;
    },
    
    /**
     * Ruft eine Methode der Klasse JNode auf, 
     * wenn der Browser für kurze Zeit nichts weiter zu tun hat (idle).
     * 
     * @see       JNode.defer
     * @param     {String}          method
     * @param     {Object}          ...
     * @returns   {JNode}
     */
    defer: function defer() 
    {
      var args = SLICE.call(arguments, 0),
          call = args.shift();
          
      JNode.defer(function() { this[call].apply(this, args); }.bind(this));
      return this;
    },
    
    /**
     * Ändert oder gibt Attribute des Elements zurück.
     *
     * @example var node = new JNode("div"); 
     * node.attr("title", "test"); // schreibt das Attribut "title" mit Inhalt "test"
     * node.attr("title"); // gibt das Attribut "title" zurück. Inhalt: "test"
     * node.attr("title", null); // entfernt das Attribut "title"
     *
     * @param     {String|Object}     needle
     * @param     {String|undefined}  value
     * @returns   {JNode|String}
     */
    attr: function attr(needle, value) 
    {
      if (arguments.length === 2) {
        if (value === null) {
          this.node.removeAttribute(needle);
          return this;
        }
        
        this.node.setAttribute(needle, value);
        return this;
      }
      
      if (typeof needle == "string")
        return this.node.getAttribute(needle);
        
      JNode.each(needle, function(v, k) {
        this.node.setAttribute(k, v);
      }, this);
      
      return this;
    },
    
    /**
     * Ändert oder gibt Style-Eigenschaften zurück.
     *
     * @example var node = new JNode("div");
     * node.style("width", "100px"); // setzt die width-Eigenschaft auf 100px
     * node.style("width:200px;"); // setzt die width-Eigenschaft auf 200px (Alternativsyntax)
     * node.style("width"); // gibt die width-Eigenschaft zurück. Inhalt: 200px
     * node.style("width", null); // entfernt die width-Eigenschaft
     *
     * @param     {String|Object}     needle
     * @param     {String|undefined}  value
     * @returns   {JNode|String}
     */
    style: function style(needle, value) 
    {
      if (arguments.length === 2) {
        if (value === null || value === "") {
          this.node.style.removeProperty(needle);
          return this;
        }
        
        this.node.style.setProperty(needle, value, "");
        return this;
      }
      
      if (typeof needle == "string") {
        if (needle.indexOf(":") > -1) {
          this.node.style.cssText += ';' + needle;
          return this;
        }
        
        // check style first
        var value;
        
        if (!!(value = this.node.style.getPropertyValue(needle)))
          return value;
        
        return document.defaultView
          .getComputedStyle(this.node, null)
          .getPropertyValue(needle);
      }
      
      // pretty bad. all the reflows and repaintings ...
      // but this is the only "clean" way to remove properties
      // if `v` is empty/null
      JNode.each(needle, function(v, k) { this.style(k, v); }, this);
      return this;
    },
    
    /**
     * Versteckt das Element (display:none)
     *
     * @example var node = new JNode(document.body);
     * node.hide(); // setzt die CSS display-Eigenschaft auf "none"
     *
     * @returns  {JNode}
     */
    hide: function hide()
    {
      return this.style("display:none;");
    },
    
    /**
     * Zeigt das Element an (display-Eigenschaft wird entfernt)
     *
     * @example var node = new JNode(document.body);
     * node.hide(); // siehe JNode#hide()
     * node.show(); // zeigt das Element wieder an.
     *
     * @example Achtung: 
     * Wenn ein Element über eine externe Quelle per CSS 
     * &lt;style&gt; oder &lt;link .../&gt; versteckt wurde, 
     * zeigt die Verwendung von JNode#show() keine Wirkung, da hierbei nur 
     * die Inline-Style-Eigenschaft "display" entfernt, nicht aber 
     * überschrieben wird.
     *
     * &lt;style type="text/css"&gt;
     *    #idref { display:none; }
     * &lt;/style&gt;
     *
     * &lt;script type="text/javascript"&gt;
     *    $("idref").show(); // Funktioniert nicht wie erwartet
     * &lt;/script&gt;
     *
     * @returns  {JNode}
     */
    show: function show()
    {
      if (this.style("display") == "none")  
        return this.style("display", "");
        
      return this;
    }, 
    
    // TODO: doku
    dim: function dim() 
    {
      var props = [this.prop('offsetWidth'), this.prop('offsetHeight')];
      
      if (this.style("display") === "none") {
        var orig = {
          visibility: this.style("visibility"),
          position:   this.style("position")
        };
        
        var tmp = new JNode(this.node.nodeName),
            dsp = tmp.style("display");
            
        tmp = null;
        var styles = "visibility:hidden;display:" + dsp;
        
        if (["absolute", "fixed"].indexOf(orig.position) == -1)
          styles += ";position:absolute";
          
        this.style(styles);
        props = [this.prop('offsetWidth'), this.prop('offsetHeight')];
        
        this.style(orig);
      }
      
      return JNode.merge(props, {
        width:  props[0],
        height: props[1]
      });
    },
    
    // TODO: doku
    width: function width()
    {
      return this.dim().width;
    },
    
    // TODO: doku
    height: function height()
    {
      return this.dim().height;
    },
    
    /**
     * Ändert oder gibt Daten zurück, die über die HTML5 dataset-Eigenschaft
     * definiert wurden.
     *
     * @example &lt;div id="idref" data-foo="bar"/&gt;
     * @example $("idref").data("foo"); // Inhlat: "bar"
     * $("idref").data("foo", "baz"); // Überschreibt den Index "foo" mit "baz"
     * $("idref").data("bar", 1234); // legt einen neuen Index "bar" mit dem Wert 1234 an
     *
     * @example Bitte beachten:
     * Alle Objekte, die über die dataset-Eigenschaft gespeichert werden, ergeben
     * echte HTML-Attribute. Daher sollten nur scalar-Werte (Number, Boolean, String) 
     * abgelegt werden.
     *
     * Komplexere Objekte können über JNode#store() gespeichert werden.
     * 
     *
     * @param     {String}            needle
     * @param     {String|undefined}  value
     * @returns   {JNode|Object}
     */
    data: function data(needle, value) 
    {
      if (arguments.length === 2) {
        this.node.dataset[needle] = value;
        return this;
      }
      
      return this.node.dataset[needle];
    },
    
    /**
     * Sucht nach Kind-Elementen innerhalb des aktuellen Elements 
     * anhand eines CSS-Selektors.
     *
     * @example &lt;div id="idref"&gt;&lt;p&gt;&lt;span&gt;&lt;em&gt;Beispiel&lt;/em&gt;&lt;/span&gt;&lt;/p&gt;&lt;/div&gt;
     * @example $("idref").select('span, em'); // Gibt eine JNode.List zurück
     * // mit den Elementen &lt;span&gt; und &lt;em&gt; zurück
     *
     *
     * @param     {String}        selector
     * @returns   {JNode.List}
     */
    select: function select(selector) 
    {
      return JNode.find(selector, this.node);
    },
    
    /**
     * Ändert oder gibt Eigenschaften zurück.
     *
     * @example &lt;div id="idref"&gt;&lt;/div&gt;
     * @example $("idref").prop('nodeName'); // gibt "DIV" zurück
     * @example $("idref").prop('innerHTML', 'test!'); // Schreibt "test!" in innerHTML
     *
     * @param     {String}            needle
     * @param     {Object|undefined}  value
     * @returns   {JNode|Object}
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
     * Erstellt ein eindeutiges ID-Attribut, falls noch keines vergeben wurde.
     *
     * @example var id = $("&lt;div/&gt;").append(document.body).identify(); 
     * // Speichert das Element innerhalb des &lt;body&gt;-Elements und erzeugt
     * // eine referenzierbare ID
     * var node = $(id); // findet das oben erstellte Element im Dokument
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
     * Umhüllt das aktuelle Element mit einem angegegenen Element
     * 
     * @example var node = new JNode('p'); // erzeugt ein P-Element
     * node.append(document.body); // Speichert das Element innerhalb von &lt;body&gt;
     *
     * @example &lt;p&gt;&lt;/p&gt;
     *
     * @example node.wrap('div');
     *
     * @example &lt;div&gt;&lt;p&gt;&lt;/p&gt;&lt;/div&gt;
     *
     * @param     {Element|JNode|String}    wrapper
     * @returns   {JNode}
     */
    wrap: function wrap(wrapper)
    {
      // TODO: INSERTIONS
      
      if (!(wrapper instanceof JNode))
        wrapper = new JNode(wrapper);
      
      if (this.node.parentNode) 
        this.node.parentNode.replaceChild(wrapper.node, this.node);
        
      wrapper.node.appendChild(this.node);
      
      return wrapper;
    },
    
    /**
     * Entfernt alle Events und Storage-Eigenschaften von diesem, sowie von 
     * Kind-Elementen und löscht dieses aus dem Dokument.
     *
     * @returns  {JNode}
     */
    remove: function remove()
    {
      this.purge().node.parentNode.removeChild(this.node);
      return this;
    },
    
    /**
     * Gibt alle Kind-Elemente zurück (keine Text-Knoten)
     *
     * @param     {Boolean}       all
     * @returns   {JNode.List}
     */
    childs: function childs(all) 
    { 
      if (all)
        return JNode.find("*", this.node);
      
      var nodes = [], node = this.node.firstElementChild;
        
      while (node) {
        nodes.push(new JNode(node));  
        node = node.nextElementSibling;
      }
        
      return new JNode.List(nodes);
    },
    
    /**
     * Gibt das erste Element zurück, welches zu den angegebenen CSS-Selector passt.
     * Ist kein CSS-Selector angegeben, wird das erste Element zurückgegben.
     *
     * @example &lt;div id="idref"&gt;&lt;p&gt;&lt;span<&gt;&lt;/span&gt;&lt;/p&gt;&lt;/div&gt;
     * @example $("idref").first(); // gibt das darauf erste P-Element zurück
     * @example $("idref").first('span'); // gibt das erste SPAN-Element zurück
     *
     * @param     {String}        selector
     * @returns   {JNode|null}
     */
    first: function first(selector) 
    {
      return JNode.find(selector || '*', this.node, true);
    },
    
    /**
     * Prüft, ob das aktuelle Element mit dem übergebenen CSS-Selektor gefunden werden 
     * kann. 
     *
     * @example &lt;p id="idref"&gt;&lt;/p&gt;
     * @example $("idref").match("p"); // Ergibt TRUE. "p" passt auf unser Element
     * $("idref").match("div"); // Ergibt FALSE. "div" passt nicht auf "p"
     * $("idref").match("#idref"); // Ergibt TRUE, #idref passt auf dieses Element
     *
     * @example Achtung:
     * Internet Explorer und MobileWebkit-basierte Browser neigen hier zu 
     * Geschwindigkeitseinbußen. Im Internet Explorer jedoch nur, wenn das Element NICHT
     * im aktuellen Dokument existiert (z.b. weil dieses eben erst erstellt wurde).
     *
     * @param     {String}    selector
     * @returns   {Boolean}
     */
    match: function match(selector)
    {
      return JNode.match(selector, this.node);
    },
    
    /**
     * Gibt das Elternelement oder, wenn dieses nicht existiert, sich selbst zurück.
     *
     * @example &lt;div&gt;&lt;p id="idref"&gt;&lt;/p&gt;&lt;/div&gt;
     * @example $("idref").parent(); // Gibt das übergeornete DIV-Element zurück.
     * 
     * @returns   {JNode}
     */
    parent: function parent()
    {
      return this.node.parentNode ? new JNode(this.node.parentNode) : this;
    },
    
    /**
     * Wandert Elemente ausgehend vom aktuellen nach oben im Dokument.
     *
     * @example &lt;div&gt;&lt;p id="idref"&gt;&lt;/p&gt;&lt;/div&gt;
     * @example $("idref").up("div"); // Wandert zum übergeordnetem DIV-Element
     * 
     * @param     {String}        selector
     * @returns   {JNode|null}
     */
    up: function up(selector) 
    {
      if (arguments.length === 0) 
        return this.parent();
      
      if (typeof selector == "number") {
        var p = this.node;
        
        while (selector-- && p.parentNode)
          p = p.parentNode;
          
        return new JNode(p);
      }
      
      var p = this.node.parentNode;
      
      while (p && p.nodeName && !JNode.match(selector, p))
        p = p.parentNode;
      
      return p ? new JNode(p) : null;
    },
    
    /**
     * Wandert Elemente ausgehend vom aktuellen nach unten im Dokument.
     *
     * @example &lt;div id="idref"&gt;&lt;p&gt;&lt;/p&gt;&lt;/div&gt;
     * @example $("idref").down("p"); // Wandert zum untergeorndetem P-Element
     *
     * @param     {String}        selector
     * @returns   {JNode|null}
     */
    down: function down(selector, index) {
      if (arguments.length === 0)
        return this.first();
        
      if (!(index && --index))
        return JNode.find(selector, this.node, true);
        
      var childs = this.node.querySelectorAll(selector);
      return childs && childs[index] ? new JNode(childs[index]) : null;
    },
    
    /**
     * Gibt das nächste Element auf der selben Ebene zurück
     *
     * @example &lt;div id="idref"&gt;&lt;/div&gt;&lt;p&gt;&lt;/p&gt;
     * @example $("idref").next("p"); // Gibt das folgende P-Element zurück
     *
     * @param     {String}    selector
     * @returns   {JNode|null}
     */
    next: function next(selector) {      
      var nodes  = this.parent().childs(),
          length = nodes.length;
      
      for (var i = 0; i < length; ++i) {
        if (nodes[i].node === this.node) {
          ++i;
          break;
        }
      }
      
      if (arguments.length === 0 || !selector)
        return nodes[i];
        
      if (typeof selector === "number")
        return nodes[i + selector];
      
      for (; i < length; ++i)
        if (nodes[i].match(selector))
          return nodes[i];
          
      return null;
    },
    
    // TODO: doku
    find: function find(selector)
    {
      if (!selector)
        return this;
        
      var node = this.node;
      
      while (node) {
        if (JNode.match(selector, node))
          return new JNode(node);
          
        node = node.parentNode;
      }
      
      return null;
    },
    
    /**
     * Fügt Elemente oder Texte an der angegebenen Position in das Element ein
     *
     * @example var node = new JNode("div");
     * node.insert("hallo");
     * node.insert(new JNode('span').insert("welt"));
     * node.insert("1234", "top"); // top: Fügt die Daten an den Anfang hinzu
     * node.insert("5678", "before"); // before: Fügt die Daten vor das Element hinzu
     * node.insert("9123", "after"); // after: Fügt die Daten nach das Element hinzu
     * node.insert("4567", "bottom"); // bottom: Fügt die Daten ans Ende des Elements hinzu
     *
     * @example Bitte beachten:
     * Unter Firefox agiert diese Methode ein wenig langsamer als normal, da
     * native Unterstützung für das Einfügen von Texten/Elementen an bestimmten Positionen
     * nicht oder nur teilweiße/über Umwege gegeben ist.
     *
     * Sie sollten daher immer möglichst viele Daten auf einmal hinzufügen.
     *
     * @example node.insert("hallo" + " " + "welt"); // Schneller als:
     * node.insert("hallo").insert(" ").insert("welt");
     *
     * @example Mehrere Elemente können als Array übergeben werden, doch auch hier
     * ist es Ratsam diese in ein DocumentFragment zu packen.
     *
     * @example // Langsamer:
     * node.insert([
     *   document.createElement("div"),
     *   document.createElement("div"),
     *   document.createElement("div")
     * ]);
     *
     * // Schneller:
     * var fragment = document.createDocumentFragment();
     * fragement.appendChild(document.createElement("div"));
     * fragement.appendChild(document.createElement("div"));
     * fragement.appendChild(document.createElement("div"));
     * node.insert(fragment);
     *
     * @param     {String|Node|JNode|Array[Node]} data
     * @param     {String}                        pos
     * @returns   {JNode}
     */
    insert: function insert(data, pos)
    {
      /** @default "bottom" */
      pos = (pos || 'bottom').toLowerCase();
      
      if (data instanceof JNode)
        data = data.node;
      else if (!(data instanceof Node) && !Array.isArray(data))
        return this.insertText(data, pos);
        
      return this.insertNode(data, pos);    
    },
    
    /** @private */
    insertText: function(content, pos) 
    {
      var div = EL_DIV, mth;
        
      if (pos === 'before' || pos === 'after')
        mth = INSERTION.tags[(this.node.parentNode || this.node).nodeName.toUpperCase()];
      else
        mth = INSERTION.tags[this.node.nodeName.toUpperCase()];
     
      if (!!mth) {
        div.innerHTML = '&nbsp;' + t[0] + content + t[1];
        div.removeChild(div.firstChild);
        
        for (var i = t[2]; i--; )
          div = div.firstChild;
      } else {
        div = div.cloneNode(true);
        div.innerHTML = data;
      }
      
      EL_DIV.innerHTML = '';
      
      var nodes = SLICE.call(div.childNodes, 0);
      return this.insertNode(nodes, pos);
    },
    
    /** @private */
    insertNode: function(content, pos) 
    {
      var mth = INSERTION[pos] || INSERTION['bottom'];
      
      if (!Array.isArray(content)) {
        mth(this.node, content);
        return this;
      }
      
      if (pos === 'top' || pos === 'after') 
        content.reverse();
      
      //for each(var node in data)
      for (var i = 0, l = content.length; i < l; ++i) { 
        var node = content[i];
        
        if (node instanceof JNode)
          node = node.node;
          
        mth(this.node, node);
      }
      
      return this;
    },
    
    /**
     * Erneuert den Inhalt des Elements in dem es zuvor alle aktuellen Inhalte entfernt.
     *
     * @example Diese Funktion entspricht JNode#insert() mit dem Unterschied,
     * dass mit dieser Methode alle Inhalte zuvor entfernt werden. 
     *
     * Folglich existiert auch kein `pos` Parameter, da die Daten immer innerhalb
     * anstelle des alten Inhalts platziert werden.
     *
     * Alle Kindelemente werden vor dem entfernen noch von Events 
     * und Storage-Eigenschaften befreit (siehe dazu JNode.remove())
     *
     * @param     {String|Node|JNode|Array[Node]}    content
     * @returns   {JNode}
     */
    update: function update(content)
    { 
      this.childs(true).invoke('purge');
      
      if (content instanceof JNode)
        content = content.node;
      
      if (content instanceof Element) {
        this.node.innerHTML = '';
        return this.insert(content);
      }
      
      this.node.innerHTML = content;
      return this;
    },
    
    /**
     * Fügt das aktuelle Element in das angegebene Element ein.
     *
     * @example var node = new JNode("div");
     * node.append(document.body); // fügt das Element in &lt;body&gt;-Element ein
     *
     * @example Falls Sie, wie in der Methode JNode.insert() die Position angeben möchten,
     * können Sie auch so vorgehen:
     *
     * var node = new JNode("div");
     * $(document.body).insert(node, "position");
     *
     * @param     {Element|JNode}   element
     * @return    {JNode}
     */
    append: function append(element)
    {
      var node = this.node;
      
      if (node.parentNode)
        node = this.clone(true, true).node;
      
      if (element instanceof JNode)
        element = element.node;
        
      element.appendChild(node);
      return this;
    },
    
    /**
     * Kopiert das Element und entfernt, falls gewünscht das ID-Attribut.
     * 
     * @param     {Boolean}   deep
     * @param     {Boolean}   removeId
     * @returns   {JNode}
     */
    clone: function clone(deep, removeId)
    {
      var c = new JNode(this.node.cloneNode(!!deep));
      
      if (removeId && c.attr("id"))
        c.attr("id", null);
        
      return c;
    },
    
    /**
     * Erstellt und gibt das Storage-Objekt für dieses Element zurück.
     *
     * @returns   {Object}
     */
    getStorage: function getStorage()
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
    },
    
    /**
     * Speichert Daten im Storage-Objekt
     *
     * @param     {String}    needle
     * @param     {Object}    value
     * @returns   {JNode}
     */
    store: function store(needle, value)
    {
      var storage = this.getStorage();
      storage[needle] = value;
      
      return this;
    },
    
    /**
     * Gibt ein gespeichertes Objekt zurück.
     *
     * @param     {String}            needle
     * @param     {Object}            fallback
     * @returns   {Object|undefined}
     */
    fetch: function fetch(needle, fallback)
    {
      var storage = this.getStorage();
      
      if (!storage[needle])
        storage[needle] = fallback;
        
      return storage[needle];
    },
    
    /**
     * Entfernt alle Events und löscht alle gespeicherten Daten im Storage-Objekt
     *
     * @returns   {JNode}
     */
    purge: function purge()
    {
      JNode.release(this.node);
      
      if (this.node._jnode_uid)
        delete JNode.Storage[this.node._jnode_uid];
      
      if (this.node !== document) {
        var childs = this.childs(true);
        if (childs) childs.invoke('purge');
      }
      
      return this;
    }
  };
  
  (function() {
    /** @private */
    function convertPosition(pos) 
    {
      switch ((pos || 'bottom').toLowerCase()) {
        case 'before':
          return 'beforebegin';
          
        case 'top':
          return 'afterbegin';
          
        case 'after':
          return 'afterend';
          
        default:
          return 'beforeend';
      }
    }
    
    if (typeof EL_DIV.insertAdjacentHTML === "function") {
      /** @private */
      JNode.prototype.insertText = function insertText(content, pos) 
      {
        this.node.insertAdjacentHTML(convertPosition(pos), content);
        return this;
      };
    }
    
    if (typeof EL_DIV.insertAdjacentElement == "function") {
      /** @private */
      JNode.prototype.insertNode = function insertNode(content, pos) 
      {
        this.node.insertAdjacentElement(convertPosition(pos), content);
        return this;
      };
    }
  })();
  
  if (typeof EL_DIV.dataset === "undefined") {
    // MSIE 9 untersützt .dataset nicht, aber "data-xyz"-attribute
    JNode.prototype.data = function data(needle, value) 
    {
      if (arguments.length === 2) {
        this.attr("data-" + needle, value);
        return this;
      }
      
      return this.attr("data-" + needle);
    };
  }
  
  if (typeof EL_DIV.classList === "undefined") {
    // HTML5 classList polyfill
    JNode.prototype._classList = function _classList()
    {
      var node = this.node, self = this;
      
      /** @private */
      function ts(c) { return c ? c.toString() : ""; }
      
      this.classList = {
        /** @private */
        add:      function(name) { node.className += " " + name; },
        /** @private */
        remove:   function(name) { node.className = ts(node.className).replace(new RegExp("\\b" + name + "\\b", "g"), ''); },
        /** @private */
        contains: function(name) { return ts(node.className).match(new RegExp("\\b" + name + "\\b")) != null; },
        /** @private */
        item:     function(index) { return (ts(node.className).split(" ") || [])[index]; },
        /** @private */
        toggle:   function(name) { this[this.contains(name) ? 'remove' : 'add'](name); },
        /** @private */
        toString: function() { return ts(this.node.className); }
      };
      
      Object.defineProperty(this.classList, 'length', { 
        /** @private */
        get: function() { return ts(node.className).split(" ").length; }
      });
    };
  }
  
  // ----------------------------------------------
  // node-list
  
  /**
   * JNode.List
   *
   * @class 
   * @param         {Array[Element|JNode]}
   * @constructor
   */
  JNode.List = function JList(nodes)
  {
    this.constructor = JList;
    
    for (var i = 0, l = nodes.length; i < l; ++i)
      this._process(i, nodes[i]);
      
    this.length = l;
  };
  
  // prototype
  JNode.List.prototype = {
    /**
     * Speichert alle Nodes in dieser Instanz als Array-like Eigenschaften
     *
     * @param     {Number}    index
     * @param     {Element}   node
     */
    _process: function _process(index, node) 
    {
      this[index] = (node instanceof JNode) ? node : new JNode(node);
    },
    
    /**
     * Ruft eine Methode aller Elemente auf
     *
     * @param     {String}      method
     * @param     {Object}      ...
     * @returns   {JNode.List}
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
     * Sammelt eine bestimmte Eigenschaft aller Elemente
     *
     * @param     {String}          prop
     * @returns   {Array[String]}
     */
    pluck: function pluck(prop)
    {
      var props = [];
      
      for (var i = 0; i < this.length; ++i)
        props.push(this[i].prop(prop));
        
      return props;
    },
    
    /**
     * alias für JNode.each
     *
     * @see       JNode.each
     * @param     {Function}      func
     * @param     {Object}        context
     * @returns   {JNode.List}
     */
    each: function each(func, context)
    {
      JNode.each(this, func, context);
      return this;
    },
    
    /**
     * Filtert Elemente anhand eines Callbacks
     *
     * @param     {Function}    func
     * @param     {Object}      context
     * @returns   {JNode.List}
     */
    filter: function filter(func, context)
    {
      var nodes = [];
      
      context && (func = func.bind(context));
      
      for (var i = 0, l = this.length; i < l; ++i)
        if (false !== func(this[i], i, this))
          nodes.push(this[i]);
          
      return new JNode.List(nodes);
    }
  };
  
  // ----------------------------------------------
  // storage
  
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
  
  // ----------------------------------------------
  // event-handling
  
  (function() {
    /** @private */
    var MOUSEENTER_LEAVE = ('onmouseleave' in EL_DIV && 'onmouseenter' in EL_DIV);
    
    /** @private */
    function getRegistry(element) 
    {
      if (element === window)
        return JNode.fetch('_eventhandler', {});
        
      return new JNode(element).fetch('_eventhandler', {});
    }
    
    /** @private */
    function createResponder(element, eventName, handler, once)
    {
      var responder = (function() {
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
        
        if (eventName.indexOf(":") == -1) {
          return function(event) { 
            handler.call(element, event || window.event); 
          };
        }
        
        return function(event) {
          if (!event.eventName || event.eventName != eventName)
            return;
            
          handler.call(element, event || window.event);
        };
      })();
      
      if (once === true) {
        responder = (function(responder) {
          return function(event) {
            JNode.release(element, eventName, handler, useCapture);
            responder(event);
          };
        })(responder);
      }
      
      return responder;
    }
    
    /** @private */
    function register(element, eventName, handler, useCapture, once) 
    {
      var registry = getRegistry(element);
      
      if (!registry[eventName])
        registry[eventName] = [];
      else
        for (var i = 0, l = registry[eventName].length; i < l; ++i)
          if (registry[eventName].handler === handler 
           && registry[eventName].useCapture === useCapture)
            return;
      
      var entry = {
        eventName:  eventName,
        handler:    handler,
        responder:  createResponder(element, eventName, handler, once),
        useCapture: useCapture
      };
      
      registry[eventName].push(entry);
      return entry;
    }
    
    /** @private */
    function unregister(element, eventName, handler, useCapture) 
    {
      var registry = getRegistry(element);
      
      if (!registry[eventName])
        return null;
      
      for (var entry, i = 0, l = registry[eventName].length; i < l; ++i) {
        entry = registry[eventName][i];
        
        if (entry.handler === handler 
         && entry.useCapture === useCapture) {
          registry[eventName].splice(i, 1);
          return entry;
        }
      }
      
      return null;
    }
    
    /** @private */
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
    
    /** @private */
    function releaseAll(element, useCapture) 
    {
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
            
          JNode.release(element, name, registry[name][i2].handler, useCapture);
        } 
      }
    }
    
    /** @private */
    function releaseType(element, eventName, useCapture) 
    {
      var registry = getRegistry(element)[eventName] || [],
          capture  = useCapture ? !!useCapture : null;
          
      for (var i = 0, l = registry.length; i < l; ++i) {
        var useCapture = capture;
        
        if (useCapture === null)
          useCapture = registry[i].useCapture;
        else if(useCapture !== registry[i].useCapture)
          continue;
        
        JNode.release(element, eventName, registry[i].handler, useCapture);
      }
    }
    
    // ----------------------------------------------
    
    /**
     * Fügt einen Event-Handler hinzu
     *
     * @event
     * @static
     * @param     {Element|Window}    element
     * @param     {String}            eventName
     * @param     {Function}          handler
     * @param     {Boolean}           useCapture
     * @param     {Boolean}           once
     */
    JNode.listen = function listen(element, eventName, handler, useCapture, once)
    {
      if (element instanceof JNode)
        element = element.node;
        
      useCapture = useCapture && useCapture === true;
      
      // dom:loaded | dom:ready -> DOMContentLoaded
      if (eventName === 'dom:loaded' || eventName === 'dom:ready') {
        if (JNode.loaded === true) {
          handler.call(element);
          return;
        }
        
        eventName = 'DOMContentLoaded';
      }
      
      var responder = register(element, eventName, handler, useCapture, once).responder;
      
      if (eventName.indexOf(":") == -1) {
        eventName = realEventName(eventName); 
        element.addEventListener(eventName, responder, useCapture);
        return;
      }
      
      element.addEventListener("dataavailable", responder, useCapture);
    };
    
    /**
     * Registriert einen listener für den angegebenen Event und entfernt diesen
     * wenn der Event zum ersten mal ausgelöst wurde.
     *
     * @event
     * @static
     * @see       JNode.listen()
     * @param     {Element|Window}    element
     * @param     {String}            eventName
     * @param     {Function}          handler
     * @param     {Boolean}           useCapture
     */
    JNode.one = function one(element, eventName, handler, useCapture)
    {     
      JNode.listen(element, eventName, handler, useCapture, true);
    };  
    
    /**
     * Entfernt einen Event-Handler
     *
     * @event
     * @static
     * @param     {Element|Window}    element
     * @param     {String}            eventName
     * @param     {Function}          handler
     * @param     {Boolean}           useCapture
     */
    JNode.release = function release(element, eventName, handler, useCapture)
    {
      if (element instanceof JNode)
        element = element.node;
        
      if (typeof eventName == "boolean") {
        useCapture = eventName;
      } else if (typeof handler == "boolean") {
        useCapture = handler;
      }
      
      var length = arguments.length;
      
      if (length === 1 || (length === 2 && typeof useCapture != "undefined")) {
        releaseAll(element, useCapture);
        return;
      }
      
      if (length === 2 || (length === 3 && typeof useCapture != "undefined")) {
        releaseType(element, eventName, useCapture);
        return;
      }
      
      var responder = unregister(element, eventName, handler, useCapture);
      
      if (!responder || !responder.responder)
        return;
        
      responder = responder.responder;
      
      if (eventName.indexOf(":") == -1) {
        eventName = realEventName(eventName);
        element.removeEventListener(eventName, responder, useCapture);
        return;
      }
      
      element.removeEventListener("dataavailable", responder, useCapture);
    };
    
    /**
     * Feuert einen Benutzerevent
     *
     * @event
     * @static
     * @param     {Element|Window}    element
     * @param     {String}            eventName
     * @param     {Object}            meta
     * @param     {Boolean}           bubble
     */
    JNode.fire = function fire(element, eventName, meta, bubble) {
      bubble = bubble ? !!bubble : true;
      
      if (!meta) meta = {};
      
      var event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', bubble, true);
      
      event.eventName = eventName;
      event.meta = meta;
      
      element.dispatchEvent(event);
    };
    
    /**
     * Entspricht JNode.listen(), bezieht sich aber auf das aktuelle Element
     * 
     * @event
     * @see       JNode.observe
     * @returns   {JNode}
     */
    JNode.prototype.listen = function listen(eventName, handler, useCapture)
    {
      JNode.listen(this.node, eventName, handler, useCapture);
      return this;
    };
    
    /**
     * Entspricht JNode.one(), bezieht sich aber auf das aktuelle Element
     *
     * @event
     * @see       JNode.one
     * @returns   {JNode}
     */
    JNode.prototype.one = function one(eventName, handler, useCapture)
    {
      JNode.one(this.node, eventName, handler, useCapture);
      return this;
    };
    
    /**
     * Entspricht JNode.release(), bezieht sich aber auf das aktuelle Element
     *
     * @event
     * @see       JNode.release
     * @returns   {JNode}
     */
    JNode.prototype.release = function release(eventName, handler, useCapture)
    {
      var args = SLICE.call(arguments);
      args.unshift(this.node);
      
      JNode.release.apply(null, args);
      return this;
    };
    
    /**
     * Entspricht JNode.fire(), bezieht sich aber auf das aktuelle Element
     *
     * @event
     * @see       JNode.fire
     * @returns   {JNode}
     */
    JNode.prototype.fire = function fire(eventName, meta, bubble)
    {
      JNode.fire(this.node, eventName, meta, bubble);
      return this;
    };
    
    JNode.loaded = false;
    JNode.listen(document, 'DOMContentLoaded', function() { JNode.loaded = true; });
    
    // ------------------------------------------------
    
    /**
     * JNode.Event
     *
     * @class
     * @param         {Event}     event
     * @constructor
     */
    JNode.Event = function JEvent(event)
    {
      this.constructor = JEvent;
      
      /**
       * Originaler Event
       *
       * @field
       */
      this.event = event;
      
      /**
       * Speichert ob der aktuelle Event gestoppt wurde
       *
       * @field
       */
      this.stopped = false;
      
      // hooks ausführen
      if (this.hook) this.hook();
    };
    
    // prototype
    JNode.Event.prototype = {
      /**
       * Gibt das Ziel-Element zurück
       *
       * @returns   {JNode}
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
       * Stoppt den Event
       *
       * @returns   {JNode.Event}
       */
      stop: function stop() 
      {
        this.event.preventDefault();
        this.event.stopPropagation();
        
        this.stopped = true;
        return this;
      },
      
      /**
       * Gibt die aktuelle Mauszeigerposition zurück
       *
       * @returns   {Object}
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
  
  // ----------------------------------------------
  // ajax/jsonp
  
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
        window[jsonp] = this.options.jsonp;
        
        var url = this.url;
        url += (url.indexOf('?') == -1 ? '?' : '&') + 'jsonp=' + jsonp;
        
        var script = new JNode('script');
        script.attr({ type: 'text/javascript', src: url });
        
        script.listen("load", function() { 
          JNode.defer(function() {
            script.remove();
            delete window[jsonp];
          });
        });
        
        script.append(document.body);        
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
  }
  
  // ----------------------------------------------
  // effects
  
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
  
  /**
   * JNode Effect Animation Engine
   *
   * Animiert CSS-Eigenschaften mithilfe von CSS3-Transitions/Transforms und Animationen.
   *
   * @example Diese Methode benötigt ALLE Argumente und geht davon aus, dass
   * diese so übergeben wurden, wie Sie benötigt werden.
   *
   * Anders hingehen arbeitet die Methode JNOde#morph(), welche die übergebenen Argumente
   * so anpasst, dass JNode#anim() damit arbeiten kann.
   *
   * Daher sollte vorzugsweise mit JNode#morph() gearbeitet werden.
   *
   * @param     {String}      styles
   * @param     {Number}      duration
   * @param     {Number}      delay
   * @param     {String}      ease
   * @param     {Function}    callback
   * @returns   {JNode}
   */
  JNode.prototype.anim = function anim(styles, duration, delay, ease, callback)
  {
    var tstyle = "", sstyle = "", endEvent, doc = new JNode(document);
    
    if (styles.indexOf(":") === -1) {
      // keyframe animation        
      endEvent = CSS_TRANSITION.aevent;
      tstyle = sstyle = CSS_TRANSITION.vendor + "animation:" + styles + " " 
        + duration + "s " + ease + " " + delay + "s";
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
        + "transition:all " + duration + "s " + ease + " " + delay + "s";
      
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
      
        JNode.defer(callback, this);
      }.bind(this));
      
      handled = true;
    }.bind(this);
    
    // doc.one(endEvent, handler, true)
    doc.listen(endEvent, handler, true);
    JNode.defer(function() { this.style(tstyle); }.bind(this));
    
    // ausführung erzwingen, da es in manchen fällen vorkommen kann, dass
    // der handler nicht ausgeführt wird.
    
    // das kann zu problemen führen, da nachfolgende änderungen an style-eigenschaften
    // animiert bleiben.
    setTimeout(handler, (duration + 2) * 1000);
    return this;
  };
  
  if (!CSS_TRANSITION) {
    // MSIE9 unterstützt keine CSS3-Transitions, aber CSS3-Transforms
    JNode.prototype.anim = function anim(styles, duration, delay, ease, callback)
    {
      // unused
      duration = delay = ease = void 0;
    
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
  
  /**
   * Diese Methode dient als Vermittler für JNode#anim()
   *
   * @param     {String}      styles
   * @param     {Number}      duration
   * @param     {Number}      delay
   * @param     {String}      ease
   * @param     {Function}    callback
   * @returns   {JNode}
   */
  JNode.prototype.morph = function morph(styles, duration, delay, ease, callback)
  {
    switch (arguments.length) {
      case 1:
        duration = .5;
        delay = 0;
        ease = "linear";
        callback = JNode.noop;
        break;
        
      case 2:
        if (typeof duration === "function") {
          callback = duration;
          duration = .5;
        }
        
        delay = 0;
        ease = "linear";
        break;
        
      case 3:
        if (typeof delay === "function") {
          callback = delay;
          delay = 0;
        }
        
        ease = "linear";
        break;
        
      case 4:
        if (typeof ease === "function") {
          callback = ease;
          ease = "linear";
        }
        
        break;
    }
    
    switch (duration) {
      case 'fast':
        duration = .1;
        break;
        
      case 'slow':
        duration = 5;
    }
    
    callback = callback || JNode.noop;    
    return this.anim(styles, duration, delay, ease, callback);
  }
  
  /**
   * Fade-Effekt
   *
   * @param     {Number|String}   duration
   * @param     {Function}        callback
   * @returns   {JNode}
   */
  JNode.prototype.fade = function fade(duration, callback) 
  {
    var args = SLICE.call(arguments, 0);
    args.unshift("opacity:0");
    
    switch (args.length) {
      case 1:
        args.push(function(node) { node.hide(); });
        break;
        
      default:
        var wrap = JNode.noop, hasc = false;
        if (typeof args[args.length - 1] === "function") {
          hasc = true;
          wrap = args[args.length - 1];
        }
        
        wrap = (function(c) { return function(n) { n.hide(); c(n); } })(wrap);
        
        if (hasc) args[args.length - 1] = wrap;
        else args.push(wrap);
    }
    
    this.style("opacity:1");
    return this.morph.apply(this, args);
  };
  
  /**
   * Appear-Effekt
   *
   * @param     {Number|String}   duration
   * @param     {Function}        callback
   * @returns   {JNode}
   */
  JNode.prototype.appear = function appear(duration, callback) 
  {
    var args = SLICE.call(arguments, 0);
    args.unshift("opacity:1");
    
    this.style("opacity:0;").show();
    return this.morph.apply(this, args);
  };
  
  // ----------------------------------------------
  // query-string parser
  
  //@require query.js
  
  JNode.GET = {};

  (function() {
    var search = window.location.search.substring(1);
    
    if (search) {
      var delim = search.replace(/[^;&]+/g, '').substr(0, 1);
      JNode.GET = JNode.Query.decode(search, delim);
    }
  })();
    
  Object.freeze(JNode.GET);
  
  // ----------------------------------------------
  // static
  
  /** @private */
  var RX_EL_ID   = /^(\w+)?#([\w:]+)$/,
      RX_EL_NAME = /^[a-zA-Z]+$/;
  
  /** @private */
  var EMPTY_JNODE_LIST = new JNode.List(EMPTY_ARRAY);
  
  /**
   * Findet alle Elemente, die auf den angegebenen CSS-Selektor passen.
   *
   * @example Dise Funktion ist, falls JNode.noConflict() nicht verwendet wurde, global
   * unter dem Shortcut $$ erreichbar.
   *
   * @static
   * @param     {String}          selector
   * @param     {Element|JNode}   context
   * @param     {Boolean}         first
   * @returns   {Array[JNode]}
   */
  JNode.find = function find(selector, context, first) 
  {
    if (context === true) {
      first   = true;
      context = null;
    }
    
    context = context 
      ? (context instanceof JNode)
        ? context.node : context : document;
    
    var nodes = [],
        match;
        
    // BODY
    if (selector.toLowerCase() === 'body') {
      match = document.body;
      first = true;
    }
    // #ID
    if (selector.match(RX_EL_ID)) {
      match = document.getElementById(RegExp.$2);
      first = true;
      
      if (RegExp.$1 && match.nodeName.toUpperCase() != RegExp.$1.toUpperCase())
        match = null;
    }
    // TAGNAME
    else if (selector.match(RX_EL_NAME)) {
      match = context.getElementsByTagName(selector);
      
      if (first) 
        match = match ? match[0] : null;
    }
    // css-selector
    else {
      match = context["querySelector" + (first ? "" : "All")](selector) || [];
      
      if (first && Array.isArray(match))
        match = null;
    }
    
    if (first)
      return match ? new JNode(match) : null;
    
    if (!match.length) 
      return EMPTY_JNODE_LIST;
    
    for (var i = 0, l = match.length; i < l; ++i)
      nodes.push(new JNode(match[i]));
      
    return new JNode.List(nodes);
  };
  
  /**
   * Prüft ob ein Element auf den angegebeneen CSS-Slektor passt.
   *
   * @example Hinweise und weitere Informationen findest du unter JNode#match()
   * 
   * based on Sizzle
   * <http://sizzlejs.com/>
   *
   * @static
   * @function
   * @param     {String}    selector
   * @param     {Element}   element
   * @returns   {Boolean}
   */
  JNode.match = (function() {
    var html    = document.documentElement,
        matches = html.matchesSelector || html.mozMatchesSelector 
               || html.webkitMatchesSelector || html.msMatchesSelector
               || html.oMatchesSelector;
    
    if (!matches) {
      /** @private */
      return function match(expr, node) { 
        var reset = false;
        
        if (!node.parentNode) {
          reset = node.style.display;
          node.style.display = 'none';
          document.body.appendChild(node); // reflow + repaint
        }
        
        var matches = SLICE.call(node.parentNode.querySelectorAll(expr), 0).indexOf(node) !== -1;
        
        if (reset !== false) {
          document.body.removeChild(node); // reflow + repaint
          node.style.display = reset;
        }
        
        return matches;
      };
    }
    
    // Check to see if it's possible to do matchesSelector
    // on a disconnected node (IE 9 fails this)
    var disconnectedMatch = !matches.call(document.createElement("div"), "div"),
        pseudoWorks       = false;
    
    try {
      // This should fail with an exception
      // Gecko does not error, returns false instead
      matches.call(html, "[test!='']:sizzle");
    } catch(pseudoError) {
      pseudoWorks = true;
    }
    
    var pseudoRegex = /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/;
    
    /** @private */
    return function match(expr, node) {
      // Make sure that attribute selectors are quoted
      expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
      
      try {
        if (pseudoWorks || pseudoRegex.test(expr) && !(/!=/.test(expr))) {
          var ret = matches.call(node, expr);

          // IE 9's matchesSelector returns false on disconnected nodes
          if (ret || !disconnectedMatch ||
            // As well, disconnected nodes are said to be in a document
            // fragment in IE 9, so check for that
            node.document && node.document.nodeType !== 11 ) {
            return ret;
          }
        }
      } catch(e) {}
      
      // MSIE 9
      if (disconnectedMatch && !node.parentNode) {
        // VERY SLOW, but this is the only way to emulate the expected behavior
        var parentNode = new JNode("div");
        parentNode.style("display:none;position:absolute;top:-100px;left:-100px").append(document.body); // reflow + repaint
        parentNode.insert(node.cloneNode(true)); // reflow + repaint
        
        var res = JNode.match(expr, node);
        parentNode.remove(); // reflow + repaint
        
        return res;
      }
      
      return false;
    };
  })();
  
  /**
   * Initialisiert aus dem/den angegebenen Argumenten eine Wrapper Klasse
   *
   * @example Diese Funktion ist, falls JNode.noConflict() nicht verwendet wurde, global
   * unter dem Shortcut $ erreichbar.
   *
   * @static
   * @param     {Object}                        indicator
   * @param     {Object}                        ...
   * @returns   {JNode.List|JNode|JNode.Event}
   */
  JNode.init = function init(indicator)
  {
    if (indicator instanceof Event)
      return new JNode.Event(indicator);
    
    if (arguments.length === 1) {
      if (indicator instanceof Element || indicator === document)
        return new JNode(indicator);
      
      var e = document.getElementById(indicator);
      return e ? new JNode(e) : null;
    }
      
    var nodes = [];
    
    for (var i = 0, r, l = arguments.length; i < l; ++i)
      if ((r = init(arguments[i])) !== null) 
        nodes.push(r);
       
    return nodes ? new JNode.List(nodes) : null;
  };
  
  /**
   * Ruft eine Funktion auf wenn der Browser für kurze Zeit 
   * nichts weiter zu tun hat (idle).
   *
   * @static
   * @param     {Function}    func
   * @returns   {Number}
   */
  JNode.defer = function defer(func) 
  {
    var args = SLICE.call(arguments, 1);
    
    return window.setTimeout(function() {
      func.apply(null, args);
    }, 10);
  };
  
  /**
   * Fungiert als `for each()` Funktion mit der sich 
   * Array/Array-Like und sonstige Objekte iterieren lassen.
   *
   * @static
   * @param     {Array|Object}    object
   * @param     {Function}        func
   * @param     {Object}          context
   */
  JNode.each = function each(object, func, context)
  {
    context && (func = func.bind(context));
    
    // JavaScript 1.8.6 
    // function.length != Array-like
    if (typeof object === "function")
      throw new TypeError;
    
    if (Array.isArray(object) || object.length != void 0) {
      for (var i = 0, l = object.length; i < l; ++i)
        if (false === func(object[i], i, object))
          break;
        
      return;
    }
    
    var keys = Object.keys(object);
    
    for (var i = 0, k, l = keys.length; i < l; ++i)
      if (false === func(object[k = keys[i]], k, object))
        break;
  };
  
  /**
   * Führt mehrere Arrays oder Objekte zusammen.
   *
   * @static
   * @param     {Object}    ...
   * @returns   {Object}
   */
  JNode.merge = function merge()
  {
    var dest = [];
    
    SLICE.call(arguments).forEach(function(source) { 
      JNode.each(source, function(v, k) {
        dest[k] = source[k];
      });
    });
    
    return dest;
  };
  
  /**
   * Globale "noop"-Funktionsreferenz
   *
   * @static
   */
  JNode.noop = function noop() {};
  
  // ----------------------------------------------
  // utilities
  
  JNode._$$ = window.$$;
  JNode._$  = window.$;
  window.$$ = JNode.find;
  window.$  = JNode.init;
  
  /**
   * Setzt die beiden Variablen $ und $$ wieder zurück, wie sie 
   * waren bevor JNode diese überschrieben hat.
   *
   * @return  Object
   */
  JNode.noConflict = function noConflict() 
  {
    window.$$ = JNode._$$;
    window.$  = JNode._$;
    
    return {
      '$$': JNode.find,
      '$':  JNode.init
    };
  };
  
  // ----------------------------------------------
  // expose
  
  return JNode;
})();
