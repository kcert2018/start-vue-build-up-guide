(function() {
  var Promise, _, cp, debug, exit, exit0, exitErr, path;

  require("./environment");

  _ = require("lodash");

  cp = require("child_process");

  path = require("path");

  Promise = require("bluebird");

  debug = require("debug")("cypress:server:cypress");

  exit = function(code) {
    if (code == null) {
      code = 0;
    }
    debug("about to exit with code", code);
    return process.exit(code);
  };

  exit0 = function() {
    return exit(0);
  };

  exitErr = function(err) {
    debug('exiting with err', err);
    return require("./errors").log(err).then(function() {
      return exit(1);
    });
  };

  module.exports = {
    isCurrentlyRunningElectron: function() {
      return !!(process.versions && process.versions.electron);
    },
    runElectron: function(mode, options) {
      return Promise["try"]((function(_this) {
        return function() {
          if (_this.isCurrentlyRunningElectron()) {
            return require("./modes")(mode, options);
          } else {
            return new Promise(function(resolve) {
              var cypressElectron, fn;
              cypressElectron = require("@packages/electron");
              fn = function(code) {
                debug("electron finished with", code);
                return resolve({
                  totalFailed: code
                });
              };
              return cypressElectron.open(".", require("./util/args").toArray(options), fn);
            });
          }
        };
      })(this));
    },
    openProject: function(options) {
      return require("./open_project").open(options.project, options);
    },
    runServer: function(options) {},
    start: function(argv) {
      var options;
      if (argv == null) {
        argv = [];
      }
      debug("starting cypress with argv %o", argv);
      options = require("./util/args").toObject(argv);
      if (options.runProject && !options.headed) {
        require("./util/electron_app").scale();
      }
      return require("./util/app_data").ensure().then((function(_this) {
        return function() {
          var mode;
          mode = (function() {
            switch (false) {
              case !options.version:
                return "version";
              case !options.smokeTest:
                return "smokeTest";
              case !options.returnPkg:
                return "returnPkg";
              case !options.logs:
                return "logs";
              case !options.clearLogs:
                return "clearLogs";
              case !options.getKey:
                return "getKey";
              case !options.generateKey:
                return "generateKey";
              case options.exitWithCode == null:
                return "exitWithCode";
              case !options.runProject:
                return "run";
              default:
                return options.mode || "interactive";
            }
          })();
          return _this.startInMode(mode, options);
        };
      })(this));
    },
    startInMode: function(mode, options) {
      debug("starting in mode %s", mode);
      switch (mode) {
        case "version":
          return require("./modes/pkg")(options).get("version").then(function(version) {
            return console.log(version);
          }).then(exit0)["catch"](exitErr);
        case "smokeTest":
          return require("./modes/smoke_test")(options).then(function(pong) {
            return console.log(pong);
          }).then(exit0)["catch"](exitErr);
        case "returnPkg":
          return require("./modes/pkg")(options).then(function(pkg) {
            return console.log(JSON.stringify(pkg));
          }).then(exit0)["catch"](exitErr);
        case "logs":
          return require("./gui/logs").print().then(exit0)["catch"](exitErr);
        case "clearLogs":
          return require("./gui/logs").clear().then(exit0)["catch"](exitErr);
        case "getKey":
          return require("./project").getSecretKeyByPath(options.projectRoot).then(function(key) {
            return console.log(key);
          }).then(exit0)["catch"](exitErr);
        case "generateKey":
          return require("./project").generateSecretKeyByPath(options.projectRoot).then(function(key) {
            return console.log(key);
          }).then(exit0)["catch"](exitErr);
        case "exitWithCode":
          return require("./modes/exit")(options).then(exit)["catch"](exitErr);
        case "run":
          return this.runElectron(mode, options).get("totalFailed").then(exit)["catch"](exitErr);
        case "interactive":
          return this.runElectron(mode, options);
        case "server":
          return this.runServer(options);
        case "openProject":
          return this.openProject(options);
        default:
          throw new Error("Cannot start. Invalid mode: '" + mode + "'");
      }
    }
  };

}).call(this);
