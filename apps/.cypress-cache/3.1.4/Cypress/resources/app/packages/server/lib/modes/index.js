(function() {
  module.exports = function(mode, options) {
    switch (mode) {
      case "record":
        return require("./record").run(options);
      case "run":
        return require("./run").run(options);
      case "interactive":
        return require("./interactive").run(options);
    }
  };

}).call(this);
