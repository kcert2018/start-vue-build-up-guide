(function() {
  var getConfig, konfig;

  require("./environment");

  konfig = require("konfig");

  getConfig = function() {
    var config, env, previousNodeEnv, previousNodeEnvExisted;
    env = process.env;
    previousNodeEnv = env.NODE_ENV;
    previousNodeEnvExisted = env.hasOwnProperty("NODE_ENV");
    env.NODE_ENV = env.CYPRESS_KONFIG_ENV || env.CYPRESS_ENV;
    config = konfig().app;
    if (previousNodeEnvExisted) {
      env.NODE_ENV = previousNodeEnv;
    } else {
      delete env.NODE_ENV;
    }
    return function(getter) {
      return config[getter];
    };
  };

  module.exports = getConfig();

}).call(this);
