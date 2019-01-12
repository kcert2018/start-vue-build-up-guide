(function() {
  var COOKIE_PROPERTIES, Promise, _, cookies, debug, extension, normalizeCookieProps, normalizeCookies;

  _ = require("lodash");

  Promise = require("bluebird");

  extension = require("@packages/extension");

  debug = require("debug")("cypress:server:cookies");

  COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry".split(" ");

  normalizeCookies = function(cookies, includeHostOnly) {
    return _.map(cookies, function(c) {
      return normalizeCookieProps(c, includeHostOnly);
    });
  };

  normalizeCookieProps = function(props, includeHostOnly) {
    var cookie;
    if (!props) {
      return props;
    }
    cookie = _.chain(props, COOKIE_PROPERTIES).pick(COOKIE_PROPERTIES).omitBy(_.isUndefined).value();
    if (includeHostOnly) {
      cookie.hostOnly = props.hostOnly;
    }
    switch (false) {
      case props.expiry == null:
        delete cookie.expiry;
        cookie.expirationDate = props.expiry;
        break;
      case props.expirationDate == null:
        delete cookie.expirationDate;
        delete cookie.url;
        cookie.expiry = props.expirationDate;
    }
    return cookie;
  };

  cookies = function(cyNamespace, cookieNamespace) {
    var isNamespaced;
    isNamespaced = function(cookie) {
      var name;
      name = cookie && cookie.name;
      if (!name) {
        return false;
      }
      return name.startsWith(cyNamespace) || name === cookieNamespace;
    };
    return {
      getCookies: function(data, automate) {
        var includeHostOnly;
        includeHostOnly = data.includeHostOnly;
        delete data.includeHostOnly;
        debug("getting:cookies %o", data);
        return automate(data).then(function(cookies) {
          cookies = normalizeCookies(cookies, includeHostOnly);
          cookies = _.reject(cookies, isNamespaced);
          debug("received get:cookies %o", cookies);
          return cookies;
        });
      },
      getCookie: function(data, automate) {
        debug("getting:cookie %o", data);
        return automate(data).then(function(cookie) {
          if (isNamespaced(cookie)) {
            throw new Error("Sorry, you cannot get a Cypress namespaced cookie.");
          } else {
            cookie = normalizeCookieProps(cookie);
            debug("received get:cookie %o", cookie);
            return cookie;
          }
        });
      },
      setCookie: function(data, automate) {
        var cookie, ref;
        if (isNamespaced(data)) {
          throw new Error("Sorry, you cannot set a Cypress namespaced cookie.");
        } else {
          cookie = normalizeCookieProps(data);
          cookie.url = (ref = data.url) != null ? ref : extension.getCookieUrl(data);
          if (data.hostOnly) {
            cookie = _.omit(cookie, "domain");
          }
          debug("set:cookie %o", cookie);
          return automate(cookie).then(function(cookie) {
            cookie = normalizeCookieProps(cookie);
            debug("received set:cookie %o", cookie);
            return cookie;
          });
        }
      },
      clearCookie: function(data, automate) {
        if (isNamespaced(data)) {
          throw new Error("Sorry, you cannot clear a Cypress namespaced cookie.");
        } else {
          debug("clear:cookie %o", data);
          return automate(data).then(function(cookie) {
            cookie = normalizeCookieProps(cookie);
            debug("received clear:cookie %o", cookie);
            return cookie;
          });
        }
      },
      clearCookies: function(data, automate) {
        var clear;
        cookies = _.reject(normalizeCookies(data), isNamespaced);
        debug("clear:cookies %o", data);
        clear = function(cookie) {
          return automate("clear:cookie", {
            name: cookie.name
          }).then(normalizeCookieProps);
        };
        return Promise.map(cookies, clear);
      },
      changeCookie: function(data) {
        var c, msg;
        c = normalizeCookieProps(data.cookie);
        if (isNamespaced(c)) {
          return;
        }
        msg = data.removed ? "Cookie Removed: '" + c.name + "'" : "Cookie Set: '" + c.name + "'";
        return {
          cookie: c,
          message: msg,
          removed: data.removed
        };
      }
    };
  };

  cookies.normalizeCookies = normalizeCookies;

  cookies.normalizeCookieProps = normalizeCookieProps;

  module.exports = cookies;

}).call(this);
