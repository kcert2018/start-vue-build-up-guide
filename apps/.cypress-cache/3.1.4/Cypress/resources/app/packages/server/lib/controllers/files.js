(function() {
  var CacheBuster, Promise, _, cwd, glob, path, pathHelpers, specsUtil;

  _ = require("lodash");

  path = require("path");

  Promise = require("bluebird");

  cwd = require("../cwd");

  glob = require("../util/glob");

  specsUtil = require("../util/specs");

  pathHelpers = require("../util/path_helpers");

  CacheBuster = require("../util/cache_buster");

  module.exports = {
    handleFiles: function(req, res, config) {
      return specsUtil.find(config).then(function(files) {
        return res.json({
          integration: files
        });
      });
    },
    handleIframe: function(req, res, config, getRemoteState) {
      var iframePath, test;
      test = req.params[0];
      iframePath = cwd("lib", "html", "iframe.html");
      return this.getSpecs(test, config).then((function(_this) {
        return function(specs) {
          return _this.getJavascripts(config).then(function(js) {
            return res.render(iframePath, {
              title: _this.getTitle(test),
              domain: getRemoteState().domainName,
              javascripts: js,
              specs: specs
            });
          });
        };
      })(this));
    },
    getSpecs: function(spec, config) {
      var convertSpecPath, getSpecs;
      convertSpecPath = (function(_this) {
        return function(spec) {
          spec = pathHelpers.getAbsolutePathToSpec(spec, config);
          return _this.prepareForBrowser(spec, config.projectRoot);
        };
      })(this);
      getSpecs = (function(_this) {
        return function() {
          if (spec === "__all") {
            return specsUtil.find(config).map(function(spec) {
              return spec.absolute;
            }).map(convertSpecPath);
          } else {
            return [convertSpecPath(spec)];
          }
        };
      })(this);
      return Promise["try"]((function(_this) {
        return function() {
          return getSpecs();
        };
      })(this));
    },
    prepareForBrowser: function(filePath, projectRoot) {
      filePath = path.relative(projectRoot, filePath);
      return this.getTestUrl(filePath);
    },
    getTestUrl: function(file) {
      file += CacheBuster.get();
      return "/__cypress/tests?p=" + file;
    },
    getTitle: function(test) {
      if (test === "__all") {
        return "All Tests";
      } else {
        return test;
      }
    },
    getJavascripts: function(config) {
      var files, javascripts, paths, projectRoot, supportFile;
      projectRoot = config.projectRoot, supportFile = config.supportFile, javascripts = config.javascripts;
      files = [].concat(javascripts);
      if (supportFile !== false) {
        files = [supportFile].concat(files);
      }
      paths = _.map(files, function(file) {
        return path.resolve(projectRoot, file);
      });
      return Promise.map(paths, function(p) {
        if (!glob.hasMagic(p)) {
          return p;
        }
        p = path.resolve(projectRoot, p);
        return glob(p, {
          nodir: true
        });
      }).then(_.flatten).map((function(_this) {
        return function(filePath) {
          return _this.prepareForBrowser(filePath, projectRoot);
        };
      })(this));
    }
  };

}).call(this);
