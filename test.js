"use strict";
var tests = [
  {
    label: "Core",
    tests: [
      {
        desc: "JNode constructor",
        pass: true,
        call: function() {
          return (new JNode("div").node instanceof HTMLDivElement) &&
                 (new JNode(document.body).node === document.body) &&
                 (new JNode(new JNode("div")).node instanceof HTMLDivElement);
        }
      },
      {
        desc: ".attr()",
        pass: "test-random-id-test123-display:none;-none-foo",
        call: function() {
          var node = new JNode("div");
          node.attr("class", "test");
          node.attr({
            id: "random-id-test123",
            style: "display:none;",
            title: "foo"
          });
          
          var klass  = node.attr("class"),
              id     = node.attr("id"),
              style  = node.attr("style").toString().replace(/\s+/g, ''),
              style2 = node.style("display"),
              title  = node.attr("title");
              
          node = null;
          return [ klass, id, style, style2, title ].join("-");
        }
      },
      {
        desc: ".style()",
        pass: "none-block-inline-inline-block",
        call: function() {
          var node = new JNode("div");
          
          node.node.style.cssText = "display:none;";
          var test1 = node.style("display");
          
          node.style("display:block;");
          var test2 = node.style("display");
          
          node.style({ display: "inline" });
          var test3 = node.style("display");
          
          node.style("display", "inline-block");
          var test4 = node.style("display");
          
          node = null;
          
          return [ test1, test2, test3, test4 ].join("-");
        }
      },
      {
        desc: ".hide()",
        pass: "none",
        call: function() {
          var node = new JNode("div");
          node.hide();
          var test = node.style("display");
          node = null;
          
          return test;
        }
      },
      {
        desc: ".show()",
        pass: "block-inline",
        call: function() {
          var node1 = new JNode("div").insert(".").append(document.body),
              node2 = new JNode("span").insert(".").append(document.body);
              
          node1.hide().show();
          var test1 = node1.style("display");
          
          node2.hide().show();
          var test2 = node2.style("display");
          
          JNode.defer(function() {
            node1.remove();
            node2.remove();
            node1 = node2 = null;
          });
          
          return [test1, test2].join("-");
        }
      },
      {
        desc: ".data()",
        pass: "hello-world",
        call: function() {
          var node = new JNode('<div data-a="hello" />');
          node.data("b", "world");
          
          var test1 = node.data("a"),
              test2 = node.data("b");
              
          node = null;
          
          return [test1, test2].join("-");
        }
      }, 
      {
        desc: ".select()",
        pass: true,
        call: function() {
          var node = new JNode("<div><span>.</span><p><em>.</em></p><p>.</p></div>");
          
          var test1 = node.select("span")[0].node.nodeName === 'SPAN',
              test2 = node.select("p em")[0].node.nodeName === 'EM',
              test3 = node.select("p").length === 2;
              
          node = null;
          
          return test1 && test2 && test3;
        } 
      },
      {
        desc: ".prop()",
        pass: "display:none;-DIV-hello world",
        call: function() {
          var node = new JNode("div").hide().insert("hello world");
                                                           // chrome fix       // opera fix
          var test = [node.prop("style").cssText.toString().replace(/\s+/g, '').replace(/^;/, ''), node.prop('nodeName'), node.prop('innerHTML')];
          node = null;
          
          return test.join("-");
        }
      },
      {
        desc: ".identify()",
        pass: true,
        call: function() {
          var node = new JNode("div");
          var id = node.identify();
          
          var test = id === node.attr("id");
          
          node.attr("id", "");
          var id = node.identify();
          
          test = test && id === node.attr("id");
          
          node = null;
          
          return test && !!id;
        }
      }, 
      {
        desc: ".wrap()",
        pass: true,
        call: function() {
          var node1 = new JNode("span");
          var node2 = node1.wrap("div");
          
          var test = node1.node.nodeName === 'SPAN' && 
            node2.node.nodeName === 'DIV' &&
            node2.node.firstChild.nodeName === 'SPAN';
          
          node1 = node2 = null;
          
          return test;
        }
      },
      {
        desc: ".remove()",
        pass: true,
        call: function() {
          var node = new JNode("div");
          var id = node.identify();
          node.append(document.body);
          
          var test1 = $(id) !== null;
          node.remove();
          
          var test2 = $(id) === null;
          
          node = null;
          
          return test1 && test2;
        }
      },
      {
        desc: ".childs()",
        pass: true,
        call: function() {
          var nodes  = new JNode('<div><span><em><strong></strong></em></span></div>'),
              achilds = nodes.childs(),
              ichilds = nodes.childs(true);
              
          var test1 = ichilds.length === 1 &&
                      ichilds[0].node.nodeName === 'SPAN',
              test2 = achilds.length === 3 &&
                      achilds[0].node.nodeName === 'SPAN' &&
                      achilds[1].node.nodeName === 'EM' &&
                      achilds[2].node.nodeName === 'STRONG';
                      
          nodes = ichilds = achilds = null;
          
          return test1 && test2;
        }
      },
      {
        desc: ".first()",
        pass: 'SPAN-EM',
        call: function() {
          var node = new JNode('<div><span></span><em></em></div>');
          var test1 = node.first().node.nodeName,
              test2 = node.first('em').node.nodeName;
          
          node = null;
          return [test1, test2].join("-");
        }
      },
      {
        desc: ".match()",
        pass: true,
        call: function() {
          var node = new JNode("<div class='foo' id='bar1234' title='hallo' />");
          var test = node.match('div') && node.match('p, span, div') &&
                     node.match('div.foo') && node.match('div#bar1234') &&
                     node.match('div[title="hallo"]') &&
                     node.match('div.foo#bar1234[title="hallo"]');
                     
          node = null;
          return test;
        }
      },
      {
        desc: ".parent()",
        pass: true,
        call: function() {
          var node = new JNode("span");
          node.wrap('div');
          
          var test1 = node.parent().node.nodeName === 'DIV';
          node = null;
          
          var node = new JNode("div");
          var test2 = node.parent() === node;
          node = null;
          
          return test1 && test2;
        }
      },
      {
        desc: ".up()",
        pass: true,
        call: function() {
          var node = new JNode("<span />");
          node.wrap('p').wrap('<div class="foo" />');
          
          var test = node.up().node.nodeName === 'P' &&
                     node.up('.foo').node.nodeName === 'DIV';
                     
          node = null;
          
          return test;
        }
      }, 
      {
        desc: ".down()",
        pass: true,
        call: function() {
          var node = new JNode('<div><p></p><div class="foo"></div></div>');
          
          var test = node.down().node.nodeName === 'P' &&
                     node.down('.foo').node.nodeName === 'DIV';
                     
          node = null;
          
          return test;
        }
      },
      {
        desc: ".next()",
        pass: true,
        call: function() {
          var node = new JNode('<div><span></span><em></em><strong></strong></div>').down('span');
          
          var test = node.next().node.nodeName === 'EM' &&
                     node.next('strong').node.nodeName === 'STRONG';
           
          node = null;
          
          return test;
        }
      },
      {
        desc: ".insert()",
        pass: "hel<span>l</span><span>o</span><span>world</span>",
        call: function() {
          var node = new JNode("div");
          node.insert("hel");
          node.insert(new JNode("span").insert("l"));
          node.insert(new JNode("span").insert("o").node);
          node.insert('<span>world</span>');
          
          var test = node.prop('innerHTML');
          node = null;
          
          return test;
        }
      },
      {
        desc: ".update()",
        pass: "hello world",
        call: function() {
          var node = new JNode("div");
          node.insert("sdfgdggfdgdgfd");
          node.insert("<div>assddff</div>");
          node.update("hello world");
          
          var test = node.prop('innerHTML');
          node = null;
          
          return test;
        } 
      },
      {
        desc: ".append()",
        pass: true,
        call: function() {
          var node = new JNode("DIV");
          new JNode("span").append(node);
          
          var test = node.down().node.nodeName === 'SPAN';
          node = null;
          
          return test;
        }
      }
    ]
  },
  {
    label: "Storage",
    tests: [
      {
        desc: "JNode#getStorage()",
        pass: true,
        call: function() {
          var node = new JNode("span");
          
          node.getStorage();
          var uid = node.node._jnode_uid;
          
          node.getStorage();
          var test = uid === node.node._jnode_uid;
          
          node.store("foo", "bar");
          test = test && node.getStorage().foo === "bar";
          node = null;
          
          var node = new JNode("div");
          node.getStorage();
          
          test = test && node.node._jnode_uid != uid;
          
          return test;
        }
      },
      {
        desc: "JNode#store() / JNode#fetch()",
        pass: true,
        call: function() {
          var node = new JNode("div");
          node.store("foo", true);
          var test = node.fetch("foo");
          
          var id = node.identify();
          node.append(document.body);
          node = null;
          
          node = $(id);
          test = test && node.fetch("foo");
          
          return test;
        }
      },
      {
        desc: "JNode#purge()",
        pass: true,
        call: function() {
          var node = new JNode("div");
          node.store("foo", "hello");
          node.purge();
          
          var test = node.fetch("foo") !== "hello";
          node = null;
          
          return test;
        }
      },
      {
        desc: "JNode.getStorage()",
        pass: true,
        call: function() {
          var s = JNode.getStorage();
          return !!s;
        }
      },
      {
        desc: "JNode.store() / JNode.fetch()",
        pass: true,
        call: function() {
          JNode.store("foo", true);
          var test = JNode.fetch("foo");
          
          return test === true;
        }
      },
      {
        desc: "JNode.purge()",
        pass: true,
        call: function() {
          JNode.store("foo", "hello");
          JNode.purge();
          
          return JNode.fetch("foo") !== "hello";
        }
      }
    ]
  },
  {
    label: "Events",
    tests: [
      {
        desc: "JNode#listen(), JNode#fire(), JNode#release()",
        pass: true,
        call: function() {
          var node = new JNode("div"), test = false;
          node.listen("custom:event", function() { test = !test; });
          node.fire("custom:event");
          node.release("custom:event");
          node.fire("custom:event");
          
          node = null;
          
          return test;
        }
      },
      {
        desc: "JNode.listen(), JNode.fire(), JNode.release()",
        pass: true,
        call: function() {
          var test = false;
          JNode.listen(window, "custom:event", function() { test = !test; });
          JNode.fire(window, "custom:event");
          JNode.release(window, "custom:event");
          JNode.fire(window, "custom:event");
          
          return test;
        }
      }
    ]
  }, 
  {
    label: "Transitions",
    tests: [
      {
        desc: ".morph() / .fade() / .appear()",
        pass: true,
        call: function() {
          var passed = true;          
          var node = new JNode("div").style("position:fixed;top:50px;left:50px;text-align:center;font-size:10px").append(document.body).insert("Hello World");
          
          node.morph("width:100px;height:20px;background:red;border:10px solid green;rotate:30deg", "fast", 
            function() {
              node.morph("height:100px;background:green;border-color:red;left:50px;top:50px;scale:1.5;border-radius:50%", "slow", 1, 
                function() {
                  node.morph("opacity:.5;width:500px;left:200px;top:200px;border-radius:0", 2, 1, 
                    function() {
                      node.morph("width:100px;background:yellow;opacity:1;border-color:blue;rotate:120deg;scale:.5;skew:30deg", 10, 1, 
                        function() {
                          node.morph("opacity:0;rotate:1080deg;scale:5;background:blue;border-color:yellow", 1, 1,
                            function() { 
                              node.remove();
                              passed = false; // MSIE will set this variable BEFORE return
                            }
                          );
                        }
                      )
                    }
                  );
                }
              );
            }
          );
          
          return passed;
        }
      }
    ]
  }, 
  {
    label: "AJAX / JSONP (open your console for results)",
    tests: [
      {
        desc: "JNode.Request XML",
        pass: true,
        call: function() {
          new JNode.Request("ajax.xml", {
            onSuccess: function(res) {
              var val = "failed";
              
              if (res.xml) {
                try {
                  val = res.xml.getElementsByTagName("test").item(0).firstChild.nodeValue;
                } catch (e) {
                  val = "exception";
                }
              }
              
              console.log("JNode.Request XML:" + val);
            },
            onFailure: function() {
              console.log("JNode.Request XML: resource not found or internal error");
            }
          });
          
          return true;
        }
      },
      {
        desc: "JNode.Request JSON",
        pass: true,
        call: function() {
          new JNode.Request("ajax.json.php", {
            onSuccess: function(res) {
              var val;
              
              try {
                val = (res.json && res.json.test === "passed") ? "passed" : "failed";
              } catch (e) {
                val = "exception";
              }
              
              console.log("JNode.Request JSON:" + val);
            },
            onFailure: function() {
              console.log("JNode.Request JSON: resource not found or internal error");
            }
          });
          
          return true;
        }
      },
      {
        desc: "JNode.Request JSONP",
        pass: true,
        call: function() {
          new JNode.Request("jsonp.php", {
            jsonp: function(json) {
              var val = (json && json.test === "passed!") ? "passed" : "failed";
              console.log("JNode.Request JSONP:" + val);
            }
          });
          
          return true;
        }
      }
    ]
  }
];

$(document).listen("dom:ready", function() {
  var body = $$("body"), b = 0;
  
  tests.forEach(function(unit) {
    body.insert("<h2>" + unit.label + "</h2>");
    
    unit.tests.forEach(function(test) {
      body.insert("<h3>" + test.desc + "</h3>");
      
      try {
        var res = test.call();
        
        if (test.pass === res)
          body.insert("<p style='color:green;font-weight:bold;'>Passed!</p>");
        else {
          body.insert("<p style='color:red;font-weight:bold;'>Failed!</p>");
          body.insert("<p>expected: " + String(test.pass) + "</p>");
          body.insert("<p>result: " + String(res) + "</p>");
        }
      } catch (e) {
        body.insert("<p style='color:yellow;font-weight:bold;'>Exception!</p>");
        console.log(e);
      }
    });
  });
});