(function() {
  var EE, Promise, Windows, _, appData, debug, menu, plugins, profileCleaner, savedState, tryToCall;

  _ = require("lodash");

  EE = require("events");

  Promise = require("bluebird");

  debug = require("debug")("cypress:server:browsers:electron");

  menu = require("../gui/menu");

  Windows = require("../gui/windows");

  appData = require("../util/app_data");

  plugins = require("../plugins");

  savedState = require("../saved_state");

  profileCleaner = require("../util/profile_cleaner");

  tryToCall = function(win, method) {
    var err;
    try {
      if (!win.isDestroyed()) {
        if (_.isString(method)) {
          return win[method]();
        } else {
          return method();
        }
      }
    } catch (error) {
      err = error;
      return debug("got error calling window method:", err.stack);
    }
  };

  module.exports = {
    _defaultOptions: function(projectRoot, state, options) {
      var _this, defaults;
      _this = this;
      defaults = {
        x: state.browserX,
        y: state.browserY,
        width: state.browserWidth || 1280,
        height: state.browserHeight || 720,
        devTools: state.isBrowserDevToolsOpen,
        minWidth: 100,
        minHeight: 100,
        contextMenu: true,
        partition: this._getPartition(options),
        trackState: {
          width: "browserWidth",
          height: "browserHeight",
          x: "browserX",
          y: "browserY",
          devTools: "isBrowserDevToolsOpen"
        },
        onFocus: function() {
          if (options.show) {
            return menu.set({
              withDevTools: true
            });
          }
        },
        onNewWindow: function(e, url) {
          var _win;
          _win = this;
          return _this._launchChild(e, url, _win, projectRoot, state, options).then(function(child) {
            return _win.on("close", function() {
              if (!child.isDestroyed()) {
                return child.close();
              }
            });
          });
        }
      };
      return _.defaultsDeep({}, options, defaults);
    },
    _render: function(url, projectRoot, options) {
      var win;
      if (options == null) {
        options = {};
      }
      win = Windows.create(projectRoot, options);
      return this._launch(win, url, options);
    },
    _launchChild: function(e, url, parent, projectRoot, state, options) {
      var parentX, parentY, ref, win;
      e.preventDefault();
      ref = parent.getPosition(), parentX = ref[0], parentY = ref[1];
      options = this._defaultOptions(projectRoot, state, options);
      _.extend(options, {
        x: parentX + 100,
        y: parentY + 100,
        trackState: false,
        onPaint: null
      });
      win = Windows.create(projectRoot, options);
      e.newGuest = win;
      return this._launch(win, url, options);
    },
    _launch: function(win, url, options) {
      if (options.show) {
        menu.set({
          withDevTools: true
        });
      }
      return Promise["try"]((function(_this) {
        return function() {
          var setProxy, ua;
          if (options.show === false) {
            _this._attachDebugger(win.webContents);
          }
          if (ua = options.userAgent) {
            _this._setUserAgent(win.webContents, ua);
          }
          setProxy = function() {
            var ps;
            if (ps = options.proxyServer) {
              return _this._setProxy(win.webContents, ps);
            }
          };
          return Promise.join(setProxy(), _this._clearCache(win.webContents));
        };
      })(this)).then(function() {
        return win.loadURL(url);
      })["return"](win);
    },
    _attachDebugger: function(webContents) {
      var err;
      try {
        webContents["debugger"].attach();
        debug("debugger attached");
      } catch (error) {
        err = error;
        debug("debugger attached failed %o", {
          err: err
        });
      }
      webContents["debugger"].on("detach", function(event, reason) {
        return debug("debugger detached due to %o", {
          reason: reason
        });
      });
      webContents["debugger"].on("message", function(event, method, params) {
        if (method === "Console.messageAdded") {
          return debug("console message: %o", params.message);
        }
      });
      return webContents["debugger"].sendCommand("Console.enable");
    },
    _getPartition: function(options) {
      if (options.isTextTerminal) {
        return "persist:run-" + process.pid;
      }
      return "persist:interactive";
    },
    _clearCache: function(webContents) {
      debug("clearing cache");
      return new Promise(function(resolve) {
        return webContents.session.clearCache(resolve);
      });
    },
    _setUserAgent: function(webContents, userAgent) {
      debug("setting user agent to:", userAgent);
      webContents.setUserAgent(userAgent);
      return webContents.session.setUserAgent(userAgent);
    },
    _setProxy: function(webContents, proxyServer) {
      return new Promise(function(resolve) {
        return webContents.session.setProxy({
          proxyRules: proxyServer
        }, resolve);
      });
    },
    open: function(browserName, url, options, automation) {
      var isTextTerminal, projectRoot;
      if (options == null) {
        options = {};
      }
      projectRoot = options.projectRoot, isTextTerminal = options.isTextTerminal;
      debug("open %o", {
        browserName: browserName,
        url: url
      });
      return savedState(projectRoot, isTextTerminal).then(function(state) {
        return state.get();
      }).then((function(_this) {
        return function(state) {
          debug("received saved state %o", state);
          options = _this._defaultOptions(projectRoot, state, options);
          options = Windows.defaults(options);
          debug("browser window options %o", _.omitBy(options, _.isFunction));
          return Promise["try"](function() {
            if (!plugins.has("before:browser:launch")) {
              return options;
            }
            return plugins.execute("before:browser:launch", options.browser, options).then(function(newOptions) {
              if (newOptions) {
                debug("received new options from plugin event %o", newOptions);
                _.extend(options, newOptions);
              }
              return options;
            });
          });
        };
      })(this)).then((function(_this) {
        return function(options) {
          debug("launching browser window to url: %s", url);
          return _this._render(url, projectRoot, options).then(function(win) {
            var a, events, invoke;
            tryToCall(win, "focusOnWebView");
            a = Windows.automation(win);
            invoke = function(method, data) {
              return tryToCall(win, function() {
                return a[method](data);
              });
            };
            automation.use({
              onRequest: function(message, data) {
                switch (message) {
                  case "get:cookies":
                    return invoke("getCookies", data);
                  case "get:cookie":
                    return invoke("getCookie", data);
                  case "set:cookie":
                    return invoke("setCookie", data);
                  case "clear:cookies":
                    return invoke("clearCookies", data);
                  case "clear:cookie":
                    return invoke("clearCookie", data);
                  case "is:automation:client:connected":
                    return invoke("isAutomationConnected", data);
                  case "take:screenshot":
                    return invoke("takeScreenshot");
                  default:
                    throw new Error("No automation handler registered for: '" + message + "'");
                }
              }
            });
            events = new EE;
            win.once("closed", function() {
              debug("closed event fired");
              return events.emit("exit");
            });
            return _.extend(events, {
              browserWindow: win,
              kill: function() {
                return tryToCall(win, "close");
              },
              removeAllListeners: function() {
                return tryToCall(win, "removeAllListeners");
              }
            });
          });
        };
      })(this));
    }
  };

}).call(this);
