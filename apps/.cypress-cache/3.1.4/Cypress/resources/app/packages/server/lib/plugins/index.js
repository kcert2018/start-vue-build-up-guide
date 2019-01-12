(function() {
  var Promise, _, cp, debug, errors, handlers, path, pluginsProcess, register, registeredEvents, util,
    slice = [].slice;

  _ = require("lodash");

  cp = require("child_process");

  path = require("path");

  debug = require("debug")("cypress:server:plugins");

  Promise = require("bluebird");

  errors = require("../errors");

  util = require("./util");

  pluginsProcess = null;

  registeredEvents = {};

  handlers = [];

  register = function(event, callback) {
    debug("register event '" + event + "'");
    if (!_.isString(event)) {
      throw new Error("The plugin register function must be called with an event as its 1st argument. You passed '" + event + "'.");
    }
    if (!_.isFunction(callback)) {
      throw new Error("The plugin register function must be called with a callback function as its 2nd argument. You passed '" + callback + "'.");
    }
    return registeredEvents[event] = callback;
  };

  module.exports = {
    registerHandler: function(handler) {
      return handlers.push(handler);
    },
    init: function(config, options) {
      debug("plugins.init", config.pluginsFile);
      return new Promise(function(resolve, reject) {
        var handleError, handler, i, ipc, killPluginsProcess, len;
        if (!config.pluginsFile) {
          return resolve();
        }
        if (pluginsProcess) {
          debug("kill existing plugins process");
          pluginsProcess.kill();
        }
        registeredEvents = {};
        pluginsProcess = cp.fork(path.join(__dirname, "child", "index.js"), ["--file", config.pluginsFile], {
          stdio: "inherit"
        });
        ipc = util.wrapIpc(pluginsProcess);
        for (i = 0, len = handlers.length; i < len; i++) {
          handler = handlers[i];
          handler(ipc);
        }
        ipc.send("load", config);
        ipc.on("loaded", function(newCfg, registrations) {
          _.each(registrations, function(registration) {
            debug("register plugins process event", registration.event, "with id", registration.eventId);
            return register(registration.event, function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              return util.wrapParentPromise(ipc, registration.eventId, function(invocationId) {
                var ids;
                debug("call event", registration.event, "for invocation id", invocationId);
                ids = {
                  eventId: registration.eventId,
                  invocationId: invocationId
                };
                return ipc.send("execute", registration.event, ids, args);
              });
            });
          });
          return resolve(newCfg);
        });
        ipc.on("load:error", function() {
          var args, type;
          type = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          return reject(errors.get.apply(errors, [type].concat(slice.call(args))));
        });
        killPluginsProcess = function() {
          pluginsProcess && pluginsProcess.kill();
          return pluginsProcess = null;
        };
        handleError = function(err) {
          debug("plugins process error:", err.stack);
          killPluginsProcess();
          err = errors.get("PLUGINS_ERROR", err.annotated || err.stack || err.message);
          err.title = "Error running plugin";
          return options.onError(err);
        };
        pluginsProcess.on("error", handleError);
        ipc.on("error", handleError);
        return process.on("exit", killPluginsProcess);
      });
    },
    register: register,
    has: function(event) {
      var isRegistered;
      isRegistered = !!registeredEvents[event];
      debug("plugin event registered? %o", {
        event: event,
        isRegistered: isRegistered
      });
      return isRegistered;
    },
    execute: function() {
      var args, event;
      event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      debug.apply(null, ["execute plugin event '" + event + "' with args: %o %o %o"].concat(slice.call(args)));
      return registeredEvents[event].apply(registeredEvents, args);
    },
    _reset: function() {
      registeredEvents = {};
      return handlers = [];
    }
  };

}).call(this);
