(function() {
  var log, screenshots;

  log = require("debug")("cypress:server:screenshot");

  screenshots = require("../screenshots");

  module.exports = function(screenshotsFolder) {
    return {
      capture: function(data, automate) {
        return screenshots.capture(data, automate).then(function(details) {
          if (!details) {
            return;
          }
          return screenshots.save(data, details, screenshotsFolder).then(function(savedDetails) {
            return screenshots.afterScreenshot(data, savedDetails);
          });
        })["catch"](function(err) {
          screenshots.clearMultipartState();
          throw err;
        });
      }
    };
  };

}).call(this);
