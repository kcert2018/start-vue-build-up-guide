(function() {
  var EE, Promise, UNDEFINED_SERIALIZED, _, debug, serializeError,
    slice = [].slice;

  _ = require("lodash");

  EE = require("events");

  debug = require("debug")("cypress:server:plugins");

  Promise = require("bluebird");

  UNDEFINED_SERIALIZED = "__cypress_undefined__";

  serializeError = function(err) {
    return _.pick(err, "name", "message", "stack", "code", "annotated");
  };

  module.exports = {
    serializeError: serializeError,
    wrapIpc: function(aProcess) {
      var emitter;
      emitter = new EE();
      aProcess.on("message", function(message) {
        return emitter.emit.apply(emitter, [message.event].concat(slice.call(message.args)));
      });
      return {
        send: function() {
          var args, event;
          event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          if (aProcess.killed) {
            return;
          }
          return aProcess.send({
            event: event,
            args: args
          });
        },
        on: emitter.on.bind(emitter),
        removeListener: emitter.removeListener.bind(emitter)
      };
    },
    wrapChildPromise: function(ipc, invoke, ids, args) {
      if (args == null) {
        args = [];
      }
      return Promise["try"](function() {
        return invoke(ids.eventId, args);
      }).then(function(value) {
        if (value === void 0) {
          value = UNDEFINED_SERIALIZED;
        }
        return ipc.send("promise:fulfilled:" + ids.invocationId, null, value);
      })["catch"](function(err) {
        return ipc.send("promise:fulfilled:" + ids.invocationId, serializeError(err));
      });
    },
    wrapParentPromise: function(ipc, eventId, callback) {
      var invocationId;
      invocationId = _.uniqueId("inv");
      return new Promise(function(resolve, reject) {
        var handler;
        handler = function(err, value) {
          ipc.removeListener("promise:fulfilled:" + invocationId, handler);
          if (err) {
            debug("promise rejected for id %s %o", invocationId, ":", err.stack);
            reject(_.extend(new Error(err.message), err));
            return;
          }
          if (value === UNDEFINED_SERIALIZED) {
            value = void 0;
          }
          debug("promise resolved for id '" + invocationId + "' with value", value);
          return resolve(value);
        };
        ipc.on("promise:fulfilled:" + invocationId, handler);
        return callback(invocationId);
      });
    }
  };

}).call(this);
