(function() {
  var clientSource, clientVersion, debug, socketIo;

  debug = require("debug")("cypress:server:controllers:client");

  socketIo = require("@packages/socket");

  clientSource = socketIo.getClientSource();

  clientVersion = socketIo.getClientVersion();

  module.exports = {
    handle: function(req, res) {
      var etag;
      etag = req.get("if-none-match");
      debug("serving socket.io client %o", {
        etag: etag,
        clientVersion: clientVersion
      });
      if (etag && (etag === clientVersion)) {
        return res.sendStatus(304);
      } else {
        return res.type("application/javascript").set("ETag", clientVersion).status(200).send(clientSource);
      }
    }
  };

}).call(this);
