(function() {
  var CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING, LOAD_EXTENSION, Promise, _, _normalizeArgExtensions, _removeRootExtension, appData, debug, defaultArgs, extension, fs, os, path, pathToExtension, pathToTheme, plugins, pluginsBeforeBrowserLaunch, utils,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require("lodash");

  os = require("os");

  path = require("path");

  Promise = require("bluebird");

  extension = require("@packages/extension");

  debug = require("debug")("cypress:server:browsers");

  plugins = require("../plugins");

  fs = require("../util/fs");

  appData = require("../util/app_data");

  utils = require("./utils");

  LOAD_EXTENSION = "--load-extension=";

  CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = "66 67".split(" ");

  pathToExtension = extension.getPathToExtension();

  pathToTheme = extension.getPathToTheme();

  defaultArgs = ["--test-type", "--ignore-certificate-errors", "--start-maximized", "--silent-debugger-extension-api", "--no-default-browser-check", "--no-first-run", "--noerrdialogs", "--enable-fixed-layout", "--disable-popup-blocking", "--disable-password-generation", "--disable-save-password-bubble", "--disable-single-click-autofill", "--disable-prompt-on-repos", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-renderer-throttling", "--disable-restore-session-state", "--disable-translate", "--disable-new-profile-management", "--disable-new-avatar-menu", "--allow-insecure-localhost", "--reduce-security-for-testing", "--enable-automation", "--disable-infobars", "--disable-device-discovery-notifications", "--disable-site-isolation-trials", "--metrics-recording-only", "--disable-prompt-on-repost", "--disable-hang-monitor", "--disable-sync", "--disable-web-resources", "--safebrowsing-disable-auto-update", "--safebrowsing-disable-download-protection", "--disable-client-side-phishing-detection", "--disable-component-update", "--disable-default-apps"];

  pluginsBeforeBrowserLaunch = function(browser, args) {
    if (!plugins.has("before:browser:launch")) {
      return args;
    }
    return plugins.execute("before:browser:launch", browser, args).then(function(newArgs) {
      debug("got user args for 'before:browser:launch'", newArgs);
      return newArgs != null ? newArgs : args;
    });
  };

  _normalizeArgExtensions = function(dest, args) {
    var extensions, loadExtension, userExtensions;
    loadExtension = _.find(args, function(arg) {
      return arg.includes(LOAD_EXTENSION);
    });
    if (loadExtension) {
      args = _.without(args, loadExtension);
      userExtensions = loadExtension.replace(LOAD_EXTENSION, "").split(",");
    }
    extensions = [].concat(userExtensions, dest, pathToTheme);
    args.push(LOAD_EXTENSION + _.compact(extensions).join(","));
    return args;
  };

  _removeRootExtension = function() {
    return fs.removeAsync(appData.path("extensions")).catchReturn(null);
  };

  module.exports = {
    _normalizeArgExtensions: _normalizeArgExtensions,
    _removeRootExtension: _removeRootExtension,
    _writeExtension: function(browserName, isTextTerminal, proxyUrl, socketIoRoute) {
      return extension.setHostAndPath(proxyUrl, socketIoRoute).then(function(str) {
        var extensionBg, extensionDest;
        extensionDest = utils.getExtensionDir(browserName, isTextTerminal);
        extensionBg = path.join(extensionDest, "background.js");
        return utils.copyExtension(pathToExtension, extensionDest).then(function() {
          return fs.writeFileAsync(extensionBg, str);
        })["return"](extensionDest);
      });
    },
    _getArgs: function(options) {
      var args, majorVersion, ps, ua;
      if (options == null) {
        options = {};
      }
      _.defaults(options, {
        browser: {}
      });
      majorVersion = options.browser.majorVersion;
      args = [].concat(defaultArgs);
      if (os.platform() === "linux") {
        args.push("--disable-gpu");
        args.push("--no-sandbox");
      }
      if (ua = options.userAgent) {
        args.push("--user-agent=" + ua);
      }
      if (ps = options.proxyServer) {
        args.push("--proxy-server=" + ps);
      }
      if (options.chromeWebSecurity === false) {
        args.push("--disable-web-security");
        args.push("--allow-running-insecure-content");
      }
      if (indexOf.call(CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING, majorVersion) >= 0) {
        args.push("--disable-blink-features=RootLayerScrolling");
      }
      return args;
    },
    open: function(browserName, url, options, automation) {
      var isTextTerminal;
      if (options == null) {
        options = {};
      }
      isTextTerminal = options.isTextTerminal;
      return Promise["try"]((function(_this) {
        return function() {
          var args;
          args = _this._getArgs(options);
          return Promise.all([utils.ensureCleanCache(browserName, isTextTerminal), pluginsBeforeBrowserLaunch(options.browser, args)]);
        };
      })(this)).spread((function(_this) {
        return function(cacheDir, args) {
          return Promise.all([_this._writeExtension(browserName, isTextTerminal, options.proxyUrl, options.socketIoRoute), _removeRootExtension()]).spread(function(extDest) {
            var userDir;
            args = _normalizeArgExtensions(extDest, args);
            userDir = utils.getProfileDir(browserName, isTextTerminal);
            args.push("--user-data-dir=" + userDir);
            args.push("--disk-cache-dir=" + cacheDir);
            debug("launch in chrome: %s, %s", url, args);
            return utils.launch(browserName, url, args);
          });
        };
      })(this));
    }
  };

}).call(this);
