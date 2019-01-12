(function() {
  var Project, Promise, _, browsers, config, create, debug, files, la, preprocessor, specsUtil,
    slice = [].slice;

  _ = require("lodash");

  la = require("lazy-ass");

  debug = require("debug")("cypress:server:openproject");

  Promise = require("bluebird");

  files = require("./controllers/files");

  config = require("./config");

  Project = require("./project");

  browsers = require("./browsers");

  specsUtil = require("./util/specs");

  preprocessor = require("./plugins/preprocessor");

  create = function() {
    var openProject, relaunchBrowser, reset, specIntervalId, tryToCall;
    openProject = null;
    specIntervalId = null;
    relaunchBrowser = null;
    reset = function() {
      openProject = null;
      return relaunchBrowser = null;
    };
    tryToCall = function(method) {
      return function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (openProject) {
          return openProject[method].apply(openProject, args);
        } else {
          return Promise.resolve(null);
        }
      };
    };
    return {
      reset: tryToCall("reset"),
      getConfig: tryToCall("getConfig"),
      createCiProject: tryToCall("createCiProject"),
      getRecordKeys: tryToCall("getRecordKeys"),
      getRuns: tryToCall("getRuns"),
      requestAccess: tryToCall("requestAccess"),
      emit: tryToCall("emit"),
      getProject: function() {
        return openProject;
      },
      launch: function(browser, spec, options) {
        var browserName;
        if (options == null) {
          options = {};
        }
        debug("resetting project state, preparing to launch browser");
        la(_.isPlainObject(browser), "expected browser object:", browser);
        browserName = browser.name;
        return this.reset().then(function() {
          return openProject.getSpecUrl(spec.absolute);
        }).then(function(url) {
          return openProject.getConfig().then(function(cfg) {
            var am, automation, onBrowserClose;
            options.browsers = cfg.browsers;
            options.proxyUrl = cfg.proxyUrl;
            options.userAgent = cfg.userAgent;
            options.proxyServer = cfg.proxyUrl;
            options.socketIoRoute = cfg.socketIoRoute;
            options.chromeWebSecurity = cfg.chromeWebSecurity;
            options.url = url;
            options.isTextTerminal = cfg.isTextTerminal;
            if (!_.has(browser, "isHeaded")) {
              browser.isHeaded = true;
              browser.isHeadless = false;
            }
            options.browser = browser;
            openProject.setCurrentSpecAndBrowser(spec, browser);
            automation = openProject.getAutomation();
            if (am = options.automationMiddleware) {
              automation.use(am);
            }
            automation.use({
              onBeforeRequest: function(message, data) {
                if (message === "take:screenshot") {
                  data.specName = spec.name;
                  return data;
                }
              }
            });
            onBrowserClose = options.onBrowserClose;
            options.onBrowserClose = function() {
              if (spec && spec.absolute) {
                preprocessor.removeFile(spec.absolute, cfg);
              }
              if (onBrowserClose) {
                return onBrowserClose();
              }
            };
            return (relaunchBrowser = function() {
              debug("launching browser: %s, spec: %s", browserName, spec.relative);
              return browsers.open(browserName, options, automation);
            })();
          });
        });
      },
      getSpecChanges: function(options) {
        var checkForSpecUpdates, currentSpecs, get, sendIfChanged;
        if (options == null) {
          options = {};
        }
        currentSpecs = null;
        _.defaults(options, {
          onChange: function() {},
          onError: function() {}
        });
        sendIfChanged = function(specs) {
          if (specs == null) {
            specs = [];
          }
          if (_.isEqual(specs, currentSpecs)) {
            return;
          }
          currentSpecs = specs;
          return options.onChange(specs);
        };
        checkForSpecUpdates = (function(_this) {
          return function() {
            if (!openProject) {
              return _this.clearSpecInterval();
            }
            return get().then(sendIfChanged)["catch"](options.onError);
          };
        })(this);
        get = function() {
          return openProject.getConfig().then(function(cfg) {
            return specsUtil.find(cfg);
          }).then(function(specs) {
            if (specs == null) {
              specs = [];
            }
            return {
              integration: specs
            };
          });
        };
        specIntervalId = setInterval(checkForSpecUpdates, 2500);
        return checkForSpecUpdates();
      },
      clearSpecInterval: function() {
        if (specIntervalId) {
          clearInterval(specIntervalId);
          return specIntervalId = null;
        }
      },
      closeBrowser: function() {
        return browsers.close();
      },
      closeOpenProjectAndBrowsers: function() {
        return Promise.all([this.closeBrowser(), openProject ? openProject.close() : void 0]).then(function() {
          reset();
          return null;
        });
      },
      close: function() {
        debug("closing opened project");
        this.clearSpecInterval();
        return this.closeOpenProjectAndBrowsers();
      },
      create: function(path, args, options) {
        if (args == null) {
          args = {};
        }
        if (options == null) {
          options = {};
        }
        openProject = Project(path);
        _.defaults(options, {
          onReloadBrowser: (function(_this) {
            return function(url, browser) {
              if (relaunchBrowser) {
                return relaunchBrowser();
              }
            };
          })(this)
        });
        options = _.extend({}, args.config, options);
        return browsers.get().then(function(b) {
          if (b == null) {
            b = [];
          }
          options.browsers = b;
          debug("opening project %s", path);
          return openProject.open(options);
        })["return"](this);
      }
    };
  };

  module.exports = create();

  module.exports.Factory = create;

}).call(this);
