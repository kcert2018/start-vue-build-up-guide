(function() {
  var CA, Server;

  CA = require("./ca");

  Server = require("./server");

  module.exports = {
    create: function(dir, port, options) {
      return CA.create(dir).then(function(ca) {
        return Server.create(ca, port, options);
      });
    },
    reset: function() {
      return Server.reset();
    },
    httpsServer: function(onRequest) {
      return require("../test/helpers/https_server").create(onRequest);
    }
  };

}).call(this);
