(function() {
  var Promise, _, cleanup, debug, ensureAndGetByName, errors, find, fs, getBrowser, instance, kill, path, throwBrowserNotFound, utils;

  _ = require("lodash");

  path = require("path");

  Promise = require("bluebird");

  debug = require("debug")("cypress:server:browsers");

  utils = require("./utils");

  errors = require("../errors");

  fs = require("../util/fs");

  instance = null;

  kill = function(unbind) {
    if (!instance) {
      return Promise.resolve();
    }
    return new Promise(function(resolve) {
      if (unbind) {
        instance.removeAllListeners();
      }
      instance.once("exit", function(code, sigint) {
        debug("browser process killed");
        return resolve.apply(null, arguments);
      });
      debug("killing browser process");
      instance.kill();
      return cleanup();
    });
  };

  cleanup = function() {
    return instance = null;
  };

  getBrowser = function(name) {
    switch (name) {
      case "chrome":
      case "chromium":
      case "canary":
        return require("./chrome");
      case "electron":
        return require("./electron");
    }
  };

  find = function(browser, browsers) {
    if (browsers == null) {
      browsers = [];
    }
    return _.find(browsers, {
      name: browser
    });
  };

  ensureAndGetByName = function(name) {
    return utils.getBrowsers().then(function(browsers) {
      if (browsers == null) {
        browsers = [];
      }
      return find(name, browsers) || throwBrowserNotFound(name, browsers);
    });
  };

  throwBrowserNotFound = function(browser, browsers) {
    var names;
    if (browsers == null) {
      browsers = [];
    }
    names = _.map(browsers, "name").join(", ");
    return errors["throw"]("BROWSER_NOT_FOUND", browser, names);
  };

  process.once("exit", kill);

  module.exports = {
    find: find,
    ensureAndGetByName: ensureAndGetByName,
    throwBrowserNotFound: throwBrowserNotFound,
    removeOldProfiles: utils.removeOldProfiles,
    get: utils.getBrowsers,
    launch: utils.launch,
    close: kill,
    open: function(name, options, automation) {
      if (options == null) {
        options = {};
      }
      return kill(true).then(function() {
        var browser, url;
        _.defaults(options, {
          onBrowserOpen: function() {},
          onBrowserClose: function() {}
        });
        if (!(browser = getBrowser(name))) {
          return throwBrowserNotFound(name, options.browsers);
        }
        if (!(url = options.url)) {
          throw new Error("options.url must be provided when opening a browser. You passed:", options);
        }
        debug("opening browser %s", name);
        return browser.open(name, url, options, automation).then(function(i) {
          debug("browser opened");
          instance = i;
          instance.once("exit", function() {
            options.onBrowserClose();
            return cleanup();
          });
          return Promise.delay(1000).then(function() {
            options.onBrowserOpen();
            return instance;
          });
        });
      });
    }
  };

}).call(this);
