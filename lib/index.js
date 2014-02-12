/**
 * async xhr, provides a modern browser
 * ajax api with less suck
 *
 * author: dhigginbotham
 * license: MIT
 */
(function (root) {

  /**
   * default set headers
   * @type {Object}
   */
  var headers = {
    'Content-Type': 'application/json'
  };

  /**
   * supported http methods
   * @private
   * @type {Array}
   */
  var methods = ['post', 'get', 'delete', 'put'];

  /**
   * supported status codes
   * @type {Array}
   */
  var allows = [200, 304];

  /**
   * internal request function
   * @param  {String}   method  Supported http method
   * @param  {String}   url     Request URI
   * @param  {Mixed}    data    Send data
   * @param  {Function} fn      Callback function
   * @return {Object}           Request response
   */
  var xhr = function (method, url, data, fn) {
    // initialize new httpreq object
    var http = internalHttpRequest();
    // make data param optional
    if (typeof data == 'function' && typeof fn == 'undefined') {
      var fn = data;
      var data = null;
    }
    // parse json
    var json = (typeof data == 'object' ? JSON.stringify(data) : data);
    // on readystatechange, do stuff.
    http.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (!allows.indexOf(this.status)) {
          return fn(null, response(this));
        } else {
          return fn(response(this), null);
        }
      }
    };
    http.open(method, url, true);
    // add all headers from header object
    for (var obj in headers) {
      http.setRequestHeader(obj, headers[obj]);
    }
    http.responseType = 'text';
    http.send(json);
  };

  /**
   * response builder with context
   * @param {Mixed}   ctx   context of response to build
   * @return {Object} resp  returns object with response.
   */
  var response = function (ctx) {
    var resp = {
      status: ctx.status,
      headers: parseHeaderString(ctx.getAllResponseHeaders())
    };
    if (ctx.response.length) {
      resp.json = JSON.parse(ctx.response);
    } else {
      resp.error = ctx.statusText;
    }
    return resp;
  };

  /**
   * parse headers into an object
   * @private
   * @param {String} headers  accepts header spec string
   * @return {Object} output  returns a valid header object
   */
  var parseHeaderString = function (headers) {
    var headArr = headers.split('\r\n');
    var ln = headArr.length;
    var output = {};
    var valArr, key, val;
    for (var i = 0; i < ln; ++i) {
      if (headArr[i].length) {
        valArr = headArr[i]
          .replace('"', '') //remove any trailing `"`
          .split(/:\s?/); //split on `:` and maybe `&nbsp;`
        key = valArr[0];
        val = valArr[1];
        output[key] = val;
      }
    }
    return output;
  };

  /**
   * add headers to the xhr request, you have
   * to set these before you send the request
   * @param {Mixed}   obj   Accepts object or string
   * @param {String}  val   Optional, read lower..
   */
  xhr.headers = function (key, val) {
    // if object is passed as key, loop
    // through headers
    if (typeof key == 'object') {
      for (var o in key) {
        headers[o] = key[o];
      }
      // if passed as individual params
      // set key, value
    } else if (key && val) {
      headers[key] = val;
      // if key exists and no value 
      // is set, delete it.
    } else if (headers.hasOwnProperty(key)) {
      delete headers[key];
      // otherwise, just return the full list
      // of headers.  
    }
    return headers;
  };

  /**
   * gets allows status codes, works like `xhr.headers`
   * @param  {Mixed} status Accepts array or string
   * @return {Array} allows array
   */
  xhr.allows = function (status) {
    if (status instanceof Array) {
      var ln = status.length;
      for (var i = 0; i < ln; ++i) {
        if (!~allows.indexOf(status[i])) {
          allows.push(status[i]);
        } else {
          continue;
        }
      }
    } else if (allows.indexOf(status) != -1) {
      allows.splice(allows.indexOf(status), 1);
    } else if (typeof status == 'number') {
      allows.push(status);
    }
    return allows;
  };

  /**
   * fallback for lame browsers
   * @private
   * @return {Function} returns client supported request obj
   */
  var internalHttpRequest = function () {
    if (root.XMLHttpRequest) {
      return new root.XMLHttpRequest();
    } else if (root.ActiveXObject) {
      return new root.ActiveXObject('Microsoft.XMLHTTP');
    }
  };

  /**
   * initialize xhr[methods], lazy -- i suppose.
   * @param  {String}     method One of the above methods
   * @return {Function}   xhr[methods] clever?
   */
  methods.forEach(function (method) {
    xhr[method] = function (url, data, fn) {
      if (typeof data == 'function' && typeof fn == 'undefined') {
        var fn = data;
        var data = null;
      }
      xhr(method, url, data, function (err, resp) {
        if (err) return fn(err, null);
        return fn(null, resp);
      });
    };
  });

  if (typeof module != 'undefined' && module.exports) {
    module.exports = xhr;
  } else {
    root.xhr = xhr;
  }

})(window);