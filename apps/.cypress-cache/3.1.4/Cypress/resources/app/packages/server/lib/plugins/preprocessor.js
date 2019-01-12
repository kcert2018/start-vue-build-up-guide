(function() {
  var EE, Promise, _, appData, baseEmitter, clientSideError, cwd, debug, errorMessage, fileObjects, fileProcessors, getOutputPath, path, plugins, savedState, setDefaultPreprocessor;

  _ = require("lodash");

  EE = require("events");

  path = require("path");

  debug = require("debug")("cypress:server:preprocessor");

  Promise = require("bluebird");

  appData = require("../util/app_data");

  cwd = require("../cwd");

  plugins = require("../plugins");

  savedState = require("../util/saved_state");

  errorMessage = function(err) {
    var ref, ref1, ref2;
    if (err == null) {
      err = {};
    }
    return ((ref = (ref1 = (ref2 = err.stack) != null ? ref2 : err.annotated) != null ? ref1 : err.message) != null ? ref : err.toString()).replace(/\n\s*at.*/g, "").replace(/From previous event:\n?/g, "");
  };

  clientSideError = function(err) {
    console.log(err.stack);
    err = errorMessage(err).replace(/\n/g, '{newline}').replace(/\[\d{1,3}m/g, '');
    return "(function () {\n  Cypress.action(\"spec:script:error\", {\n    type: \"BUNDLE_ERROR\",\n    error: " + (JSON.stringify(err)) + "\n  })\n}())";
  };

  getOutputPath = function(config, filePath) {
    return appData.projectsPath(savedState.toHashName(config.projectRoot), "bundles", filePath);
  };

  baseEmitter = new EE();

  fileObjects = {};

  fileProcessors = {};

  setDefaultPreprocessor = function() {
    var browserify;
    debug("set default preprocessor");
    browserify = require("@cypress/browserify-preprocessor");
    return plugins.register("file:preprocessor", browserify());
  };

  plugins.registerHandler(function(ipc) {
    ipc.on("preprocessor:rerun", function(filePath) {
      debug("ipc preprocessor:rerun event");
      return baseEmitter.emit("file:updated", filePath);
    });
    return baseEmitter.on("close", function(filePath) {
      debug("base emitter plugin close event");
      return ipc.send("preprocessor:close", filePath);
    });
  });

  module.exports = {
    errorMessage: errorMessage,
    clientSideError: clientSideError,
    emitter: baseEmitter,
    getFile: function(filePath, config) {
      var baseFilePath, fileObject, fileProcessor, preprocessor, shouldWatch;
      filePath = path.resolve(config.projectRoot, filePath);
      debug("getFile " + filePath);
      if (!(fileObject = fileObjects[filePath])) {
        shouldWatch = !config.isTextTerminal;
        baseFilePath = filePath.replace(config.projectRoot, "").replace(config.integrationFolder, "");
        fileObject = fileObjects[filePath] = _.extend(new EE(), {
          filePath: filePath,
          shouldWatch: shouldWatch,
          outputPath: getOutputPath(config, baseFilePath)
        });
        fileObject.on("rerun", function() {
          debug("file object rerun event");
          return baseEmitter.emit("file:updated", filePath);
        });
        baseEmitter.once("close", function() {
          debug("base emitter native close event");
          return fileObject.emit("close");
        });
      }
      if (!plugins.has("file:preprocessor")) {
        setDefaultPreprocessor(config);
      }
      if (config.isTextTerminal && (fileProcessor = fileProcessors[filePath])) {
        debug("headless and already processed");
        return fileProcessor;
      }
      preprocessor = fileProcessors[filePath] = Promise["try"](function() {
        return plugins.execute("file:preprocessor", fileObject);
      });
      return preprocessor;
    },
    removeFile: function(filePath, config) {
      var fileObject;
      filePath = path.resolve(config.projectRoot, filePath);
      if (!fileProcessors[filePath]) {
        return;
      }
      debug("removeFile " + filePath);
      baseEmitter.emit("close", filePath);
      if (fileObject = fileObjects[filePath]) {
        fileObject.emit("close");
      }
      delete fileObjects[filePath];
      return delete fileProcessors[filePath];
    },
    close: function() {
      debug("close preprocessor");
      fileObjects = {};
      fileProcessors = {};
      baseEmitter.emit("close");
      return baseEmitter.removeAllListeners();
    }
  };

}).call(this);
