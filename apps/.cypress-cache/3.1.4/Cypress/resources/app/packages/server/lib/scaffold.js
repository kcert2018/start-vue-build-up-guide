(function() {
  var Promise, _, always, cwd, cypressEx, debug, equals, exampleFolderName, filesNamesAreDifferent, filesSizesAreSame, fs, getExampleSpecs, getExampleSpecsFullPaths, getFileSize, getIndexedExample, getPathFromIntegrationFolder, glob, head, isDefault, isDifferentNumberOfFiles, isEmpty, isNewProject, log, path, ref;

  _ = require("lodash");

  Promise = require("bluebird");

  path = require("path");

  cypressEx = require("@packages/example");

  log = require("debug")("cypress:server:scaffold");

  fs = require("./util/fs");

  glob = require("./util/glob");

  cwd = require("./cwd");

  debug = require("debug")("cypress:server:scaffold");

  ref = require("ramda"), equals = ref.equals, head = ref.head, isEmpty = ref.isEmpty, always = ref.always;

  isDefault = require("./util/config").isDefault;

  exampleFolderName = cypressEx.getFolderName();

  getExampleSpecsFullPaths = cypressEx.getPathToExamples();

  getPathFromIntegrationFolder = function(file) {
    return file.substring(file.indexOf("integration/") + "integration/".length);
  };

  isDifferentNumberOfFiles = function(files, exampleSpecs) {
    return files.length !== exampleSpecs.length;
  };

  getExampleSpecs = function() {
    return getExampleSpecsFullPaths.then(function(fullPaths) {
      var index, shortPaths;
      shortPaths = _.map(fullPaths, function(file) {
        return getPathFromIntegrationFolder(file);
      });
      index = _.transform(shortPaths, function(memo, spec, i) {
        return memo[spec] = fullPaths[i];
      }, {});
      return {
        fullPaths: fullPaths,
        shortPaths: shortPaths,
        index: index
      };
    });
  };

  getIndexedExample = function(file, index) {
    return index[getPathFromIntegrationFolder(file)];
  };

  filesNamesAreDifferent = function(files, index) {
    return _.some(files, function(file) {
      return !getIndexedExample(file, index);
    });
  };

  getFileSize = function(file) {
    return fs.statAsync(file).get("size");
  };

  filesSizesAreSame = function(files, index) {
    return Promise.join(Promise.all(_.map(files, getFileSize)), Promise.all(_.map(files, function(file) {
      return getFileSize(getIndexedExample(file, index));
    }))).spread(function(fileSizes, originalFileSizes) {
      return _.every(fileSizes, function(size, i) {
        return size === originalFileSizes[i];
      });
    });
  };

  isNewProject = function(integrationFolder) {
    debug("determine if new project by globbing files in %o", {
      integrationFolder: integrationFolder
    });
    return glob("{*,*/*,*/*/*}", {
      cwd: integrationFolder,
      realpath: true,
      nodir: true
    }).then(function(files) {
      debug("found " + files.length + " files in folder " + integrationFolder);
      debug("determine if we should scaffold:");
      debug("- empty?", isEmpty(files));
      if (isEmpty(files)) {
        return true;
      }
      return getExampleSpecs().then(function(exampleSpecs) {
        var filesNamesDifferent, numFilesDifferent;
        numFilesDifferent = isDifferentNumberOfFiles(files, exampleSpecs.shortPaths);
        debug("- different number of files?", numFilesDifferent);
        if (numFilesDifferent) {
          return false;
        }
        filesNamesDifferent = filesNamesAreDifferent(files, exampleSpecs.index);
        debug("- different file names?", filesNamesDifferent);
        if (filesNamesDifferent) {
          return false;
        }
        return filesSizesAreSame(files, exampleSpecs.index);
      });
    }).then(function(sameSizes) {
      debug("- same sizes?", sameSizes);
      return sameSizes;
    });
  };

  module.exports = {
    isNewProject: isNewProject,
    integrationExampleName: function() {
      return exampleFolderName;
    },
    integration: function(folder, config) {
      debug("integration folder " + folder);
      if (!isDefault(config, "integrationFolder")) {
        return Promise.resolve();
      }
      return this.verifyScaffolding(folder, (function(_this) {
        return function() {
          debug("copying examples into " + folder);
          return getExampleSpecs().then(function(arg) {
            var fullPaths;
            fullPaths = arg.fullPaths;
            return Promise.all(_.map(fullPaths, function(file) {
              return _this._copy(file, path.join(folder, exampleFolderName), config);
            }));
          });
        };
      })(this));
    },
    fixture: function(folder, config) {
      debug("fixture folder " + folder);
      if (!config.fixturesFolder || !isDefault(config, "fixturesFolder")) {
        return Promise.resolve();
      }
      return this.verifyScaffolding(folder, (function(_this) {
        return function() {
          debug("copying example.json into " + folder);
          return _this._copy("fixtures/example.json", folder, config);
        };
      })(this));
    },
    support: function(folder, config) {
      debug("support folder " + folder + ", support file " + config.supportFile);
      if (!config.supportFile || !isDefault(config, "supportFile")) {
        return Promise.resolve();
      }
      return this.verifyScaffolding(folder, (function(_this) {
        return function() {
          debug("copying commands.js and index.js to " + folder);
          return Promise.join(_this._copy("support/commands.js", folder, config), _this._copy("support/index.js", folder, config));
        };
      })(this));
    },
    plugins: function(folder, config) {
      debug("plugins folder " + folder);
      if (!config.pluginsFile || !isDefault(config, "pluginsFile")) {
        return Promise.resolve();
      }
      return this.verifyScaffolding(folder, (function(_this) {
        return function() {
          debug("copying index.js into " + folder);
          return _this._copy("plugins/index.js", folder, config);
        };
      })(this));
    },
    _copy: function(file, folder, config) {
      var dest, src;
      src = path.resolve(cwd("lib", "scaffold"), file);
      dest = path.join(folder, path.basename(file));
      return this._assertInFileTree(dest, config).then(function() {
        return fs.copyAsync(src, dest);
      });
    },
    verifyScaffolding: function(folder, fn) {
      debug("verify scaffolding in " + folder);
      return fs.statAsync(folder).then(function() {
        return debug("folder " + folder + " already exists");
      })["catch"]((function(_this) {
        return function() {
          debug("missing folder " + folder);
          return fn.call(_this);
        };
      })(this));
    },
    fileTree: function(config) {
      var getFilePath;
      if (config == null) {
        config = {};
      }
      getFilePath = function(dir, name) {
        return path.relative(config.projectRoot, path.join(dir, name));
      };
      return getExampleSpecs().then((function(_this) {
        return function(specs) {
          var files;
          files = _.map(specs.shortPaths, function(file) {
            return getFilePath(config.integrationFolder, file);
          });
          if (config.fixturesFolder) {
            files = files.concat([getFilePath(config.fixturesFolder, "example.json")]);
          }
          if (config.supportFolder && config.supportFile !== false) {
            files = files.concat([getFilePath(config.supportFolder, "commands.js"), getFilePath(config.supportFolder, "index.js")]);
          }
          if (config.pluginsFile) {
            files = files.concat([getFilePath(path.dirname(config.pluginsFile), "index.js")]);
          }
          debug("scaffolded files %j", files);
          return _this._fileListToTree(files);
        };
      })(this));
    },
    _fileListToTree: function(files) {
      return _.reduce(files, function(tree, file) {
        var parts, placeholder;
        placeholder = tree;
        parts = file.split("/");
        _.each(parts, function(part, index) {
          var entry;
          if (!(entry = _.find(placeholder, {
            name: part
          }))) {
            entry = {
              name: part
            };
            if (index < parts.length - 1) {
              entry.children = [];
            }
            placeholder.push(entry);
          }
          return placeholder = entry.children;
        });
        return tree;
      }, []);
    },
    _assertInFileTree: function(filePath, config) {
      var relativeFilePath;
      relativeFilePath = path.relative(config.projectRoot, filePath);
      return this.fileTree(config).then((function(_this) {
        return function(fileTree) {
          if (!_this._inFileTree(fileTree, relativeFilePath)) {
            throw new Error("You attempted to scaffold a file, '" + relativeFilePath + "', that's not in the scaffolded file tree. This is because you added, removed, or changed a scaffolded file. Make sure to update scaffold#fileTree to match your changes.");
          }
        };
      })(this));
    },
    _inFileTree: function(fileTree, filePath) {
      var branch, found, j, len, part, parts;
      branch = fileTree;
      parts = filePath.split("/");
      for (j = 0, len = parts.length; j < len; j++) {
        part = parts[j];
        if (found = _.find(branch, {
          name: part
        })) {
          branch = found.children;
        } else {
          return false;
        }
      }
      return true;
    }
  };

}).call(this);
