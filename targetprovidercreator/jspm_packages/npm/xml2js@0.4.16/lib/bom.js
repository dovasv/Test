/* */ 
(function() {
  "use strict";
  var xml2js;
  xml2js = require('./xml2js');
  exports.stripBOM = function(str) {
    if (str[0] === '\uFEFF') {
      return str.substring(1);
    } else {
      return str;
    }
  };
}).call(this);
