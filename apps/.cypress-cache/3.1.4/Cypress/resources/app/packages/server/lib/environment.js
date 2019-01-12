(function() {
  var Promise, app, base, config, cwd, env, os, pkg, ref;

  require("./util/http_overrides");

  require("./util/fs");

  os = require("os");

  cwd = require("./cwd");

  Promise = require("bluebird");

  Error.stackTraceLimit = 2e308;

  pkg = require("@packages/root");

  try {
    app = require("electron").app;
    app.commandLine.appendSwitch("disable-renderer-backgrounding", true);
    app.commandLine.appendSwitch("ignore-certificate-errors", true);
    if (os.platform() === "linux") {
      app.disableHardwareAcceleration();
    }
  } catch (error) {}

  env = (base = process.env)["CYPRESS_ENV"] || (base["CYPRESS_ENV"] = (ref = pkg.env) != null ? ref : "development");

  config = {
    cancellation: true
  };

  if (env === "dev") {
    config.longStackTraces = true;
  }

  Promise.config(config);

  module.exports = env;

}).call(this);
