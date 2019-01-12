(function() {
  var Promise, cp, debug, fs, inspector, install, minimist, path, paths;

  fs = require("fs-extra");

  cp = require("child_process");

  path = require("path");

  debug = require("debug")("cypress:electron");

  Promise = require("bluebird");

  minimist = require("minimist");

  inspector = require("inspector");

  paths = require("./paths");

  install = require("./install");

  fs = Promise.promisifyAll(fs);

  module.exports = {
    installIfNeeded: function() {
      return install.check();
    },
    install: function() {
      debug("installing %j", arguments);
      return install["package"].apply(install, arguments);
    },
    cli: function(argv) {
      var opts, pathToApp;
      if (argv == null) {
        argv = [];
      }
      opts = minimist(argv);
      debug("cli options %j", opts);
      pathToApp = argv[0];
      switch (false) {
        case !opts.install:
          return this.installIfNeeded();
        case !pathToApp:
          return this.open(pathToApp, argv);
        default:
          throw new Error("No path to your app was provided.");
      }
    },
    open: function(appPath, argv, cb) {
      var dest;
      debug("opening %s", appPath);
      appPath = path.resolve(appPath);
      dest = paths.getPathToResources("app");
      debug("appPath %s", appPath);
      debug("dest path %s", dest);
      return fs.statAsync(appPath).then(function() {
        debug("appPath exists %s", appPath);
        return fs.removeAsync(dest);
      }).then(function() {
        var symlinkType;
        symlinkType = paths.getSymlinkType();
        debug("making symlink from %s to %s of type %s", appPath, dest, symlinkType);
        return fs.ensureSymlinkAsync(appPath, dest, symlinkType);
      }).then(function() {
        var dp, execPath, opts;
        execPath = paths.getPathToExec();
        debug("spawning %s", execPath);
        if (inspector.url()) {
          dp = process.debugPort + 1;
          argv.unshift("--inspect-brk=" + dp);
        } else {
          opts = minimist(argv);
          if (opts.inspectBrk) {
            argv.unshift("--inspect-brk=5566");
          }
        }
        return cp.spawn(execPath, argv, {
          stdio: "inherit"
        }).on("close", function(code) {
          debug("electron closing with code", code);
          if (code) {
            debug("original command was");
            debug(execPath, argv.join(" "));
          }
          if (cb) {
            debug("calling callback with code", code);
            return cb(code);
          } else {
            debug("process.exit with code", code);
            return process.exit(code);
          }
        });
      })["catch"](function(err) {
        console.debug(err.stack);
        return process.exit(1);
      });
    }
  };

}).call(this);
