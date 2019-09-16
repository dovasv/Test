/* */ 
(function() {
  var XMLCData,
      XMLNode,
      create,
      extend = function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key))
            child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      },
      hasProp = {}.hasOwnProperty;
  create = require('lodash/create');
  XMLNode = require('./XMLNode');
  module.exports = XMLCData = (function(superClass) {
    extend(XMLCData, superClass);
    function XMLCData(parent, text) {
      XMLCData.__super__.constructor.call(this, parent);
      if (text == null) {
        throw new Error("Missing CDATA text");
      }
      this.text = this.stringify.cdata(text);
    }
    XMLCData.prototype.clone = function() {
      return create(XMLCData.prototype, this);
    };
    XMLCData.prototype.toString = function(options, level) {
      var indent,
          newline,
          offset,
          pretty,
          r,
          ref,
          ref1,
          ref2,
          space;
      pretty = (options != null ? options.pretty : void 0) || false;
      indent = (ref = options != null ? options.indent : void 0) != null ? ref : '  ';
      offset = (ref1 = options != null ? options.offset : void 0) != null ? ref1 : 0;
      newline = (ref2 = options != null ? options.newline : void 0) != null ? ref2 : '\n';
      level || (level = 0);
      space = new Array(level + offset + 1).join(indent);
      r = '';
      if (pretty) {
        r += space;
      }
      r += '<![CDATA[' + this.text + ']]>';
      if (pretty) {
        r += newline;
      }
      return r;
    };
    return XMLCData;
  })(XMLNode);
}).call(this);
