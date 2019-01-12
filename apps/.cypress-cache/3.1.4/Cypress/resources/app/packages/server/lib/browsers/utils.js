(function() {
  var PATH_TO_BROWSERS, Promise, appData, copyExtension, ensureCleanCache, fs, getExtensionDir, getPartition, getProfileDir, launcher, path, profileCleaner, removeOldProfiles;

  path = require("path");

  Promise = require("bluebird");

  launcher = require("@packages/launcher");

  fs = require("../util/fs");

  appData = require("../util/app_data");

  profileCleaner = require("../util/profile_cleaner");

  PATH_TO_BROWSERS = appData.path("browsers");

  copyExtension = function(src, dest) {
    return fs.copyAsync(src, dest);
  };

  getPartition = function(isTextTerminal) {
    if (isTextTerminal) {
      return "run-" + process.pid;
    }
    return "interactive";
  };

  getProfileDir = function(browserName, isTextTerminal) {
    return path.join(PATH_TO_BROWSERS, browserName, getPartition(isTextTerminal));
  };

  getExtensionDir = function(browserName, isTextTerminal) {
    return path.join(getProfileDir(browserName, isTextTerminal), "CypressExtension");
  };

  ensureCleanCache = function(browserName, isTextTerminal) {
    var p;
    p = path.join(getProfileDir(browserName, isTextTerminal), "CypressCache");
    return fs.removeAsync(p).then(function() {
      return fs.ensureDirAsync(p);
    })["return"](p);
  };

  removeOldProfiles = function() {
    var pathToPartitions, pathToProfiles;
    pathToProfiles = path.join(PATH_TO_BROWSERS, "*");
    pathToPartitions = appData.electronPartitionsPath();
    return Promise.all([profileCleaner.removeRootProfile(pathToProfiles, [path.join(pathToProfiles, "run-*"), path.join(pathToProfiles, "interactive")]), profileCleaner.removeInactiveByPid(pathToProfiles, "run-"), profileCleaner.removeInactiveByPid(pathToPartitions, "run-")]);
  };

  module.exports = {
    copyExtension: copyExtension,
    getProfileDir: getProfileDir,
    getExtensionDir: getExtensionDir,
    ensureCleanCache: ensureCleanCache,
    removeOldProfiles: removeOldProfiles,
    getBrowsers: function() {
      return launcher.detect().then(function(browsers) {
        var version;
        if (browsers == null) {
          browsers = [];
        }
        version = process.versions.chrome || "";
        return browsers.concat({
          name: "electron",
          displayName: "Electron",
          version: version,
          path: "",
          majorVersion: version.split(".")[0],
          info: "Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses."
        });
      });
    },
    launch: function(name, url, args) {
      return launcher().call("launch", name, url, args);
    }
  };

}).call(this);
