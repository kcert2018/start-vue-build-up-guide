(function() {
  var Promise, _, debug, docsUrl, plugins, throwKnownError;

  _ = require("lodash");

  Promise = require("bluebird");

  debug = require("debug")("cypress:server:task");

  plugins = require("./plugins");

  docsUrl = "https://on.cypress.io/api/task";

  throwKnownError = function(message, props) {
    var err;
    if (props == null) {
      props = {};
    }
    err = new Error(message);
    _.extend(err, props, {
      isKnownError: true
    });
    throw err;
  };

  module.exports = {
    run: function(pluginsFilePath, options) {
      var fileAndDocsUrl;
      debug("run task", options.task, "with arg", options.arg);
      fileAndDocsUrl = "\n\nFix this in your plugins file here:\n" + pluginsFilePath + "\n\n" + docsUrl;
      return Promise["try"](function() {
        if (!plugins.has("task")) {
          debug("'task' event is not registered");
          throwKnownError("The 'task' event has not been registered in the plugins file. You must register it before using cy.task()" + fileAndDocsUrl);
        }
        return plugins.execute("task", options.task, options.arg);
      }).then(function(result) {
        if (result === "__cypress_unhandled__") {
          debug("task is unhandled");
          return plugins.execute("_get:task:keys").then(function(keys) {
            return throwKnownError("The task '" + options.task + "' was not handled in the plugins file. The following tasks are registered: " + (keys.join(", ")) + fileAndDocsUrl);
          });
        }
        if (result === void 0) {
          debug("result is undefined");
          return plugins.execute("_get:task:body", options.task).then(function(body) {
            var handler;
            handler = body ? "\n\nThe task handler was:\n\n" + body : "";
            return throwKnownError("The task '" + options.task + "' returned undefined. You must return a promise, a value, or null to indicate that the task was handled." + handler + fileAndDocsUrl);
          });
        }
        debug("result is:", result);
        return result;
      }).timeout(options.timeout)["catch"](Promise.TimeoutError, function() {
        debug("timed out after " + options.timeout + "ms");
        return plugins.execute("_get:task:body", options.task).then(function(body) {
          var err;
          err = new Error("The task handler was:\n\n" + body + fileAndDocsUrl);
          err.timedOut = true;
          throw err;
        });
      });
    }
  };

}).call(this);
