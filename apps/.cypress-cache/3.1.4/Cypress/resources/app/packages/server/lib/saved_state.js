(function() {
  var FileUtil, _, appData, debug, normalizeAndWhitelistSet, savedStateUtil, stateFiles, whitelist;

  _ = require("lodash");

  debug = require("debug")("cypress:server:saved_state");

  FileUtil = require("./util/file");

  appData = require("./util/app_data");

  savedStateUtil = require("./util/saved_state");

  stateFiles = {};

  whitelist = "appWidth\nappHeight\nappX\nappY\nautoScrollingEnabled\nbrowserWidth\nbrowserHeight\nbrowserX\nbrowserY\nisAppDevToolsOpen\nisBrowserDevToolsOpen\nreporterWidth\nshowedOnBoardingModal".trim().split(/\s+/);

  normalizeAndWhitelistSet = function(set, key, value) {
    var invalidKeys, tmp, valueObject;
    valueObject = _.isString(key) ? (tmp = {}, tmp[key] = value, tmp) : key;
    invalidKeys = _.filter(_.keys(valueObject), function(key) {
      return !_.includes(whitelist, key);
    });
    if (invalidKeys.length) {
      console.error("WARNING: attempted to save state for non-whitelisted key(s): " + (invalidKeys.join(', ')) + ". All keys must be whitelisted in server/lib/saved_state.coffee");
    }
    return set(_.pick(valueObject, whitelist));
  };

  module.exports = function(projectRoot, isTextTerminal) {
    if (isTextTerminal) {
      debug("noop saved state");
      return Promise.resolve(FileUtil.noopFile);
    }
    return savedStateUtil.formStatePath(projectRoot).then(function(statePath) {
      var fullStatePath, stateFile;
      fullStatePath = appData.projectsPath(statePath);
      debug('full state path %s', fullStatePath);
      if (stateFiles[fullStatePath]) {
        return stateFiles[fullStatePath];
      }
      debug('making new state file around %s', fullStatePath);
      stateFile = new FileUtil({
        path: fullStatePath
      });
      stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndWhitelistSet);
      stateFiles[fullStatePath] = stateFile;
      return stateFile;
    });
  };

}).call(this);
