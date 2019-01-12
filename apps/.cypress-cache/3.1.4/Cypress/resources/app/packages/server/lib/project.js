(function() {
  var Automation, EE, Project, Promise, R, Reporter, Server, Watchers, _, api, browsers, cache, check, commitInfo, config, cwd, debug, errors, fs, la, localCwd, logger, multipleForwardSlashesRe, path, plugins, preprocessor, savedState, scaffold, scaffoldDebug, settings, specsUtil, user,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require("lodash");

  R = require("ramda");

  EE = require("events");

  path = require("path");

  Promise = require("bluebird");

  commitInfo = require("@cypress/commit-info");

  la = require("lazy-ass");

  check = require("check-more-types");

  scaffoldDebug = require("debug")("cypress:server:scaffold");

  debug = require("debug")("cypress:server:project");

  cwd = require("./cwd");

  api = require("./api");

  user = require("./user");

  cache = require("./cache");

  config = require("./config");

  logger = require("./logger");

  errors = require("./errors");

  Server = require("./server");

  plugins = require("./plugins");

  scaffold = require("./scaffold");

  Watchers = require("./watchers");

  Reporter = require("./reporter");

  browsers = require("./browsers");

  savedState = require("./saved_state");

  Automation = require("./automation");

  preprocessor = require("./plugins/preprocessor");

  fs = require("./util/fs");

  settings = require("./util/settings");

  specsUtil = require("./util/specs");

  localCwd = cwd();

  multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g;

  Project = (function(superClass) {
    extend(Project, superClass);

    function Project(projectRoot) {
      this.getConfig = bind(this.getConfig, this);
      if (!(this instanceof Project)) {
        return new Project(projectRoot);
      }
      if (!projectRoot) {
        throw new Error("Instantiating lib/project requires a projectRoot!");
      }
      if (!check.unemptyString(projectRoot)) {
        throw new Error("Expected project root path, not " + projectRoot);
      }
      this.projectRoot = path.resolve(projectRoot);
      this.watchers = Watchers();
      this.cfg = null;
      this.spec = null;
      this.browser = null;
      this.server = null;
      this.memoryCheck = null;
      this.automation = null;
      debug("Project created %s", this.projectRoot);
    }

    Project.prototype.open = function(options) {
      var logMemory;
      if (options == null) {
        options = {};
      }
      debug("opening project instance %s", this.projectRoot);
      this.server = Server();
      _.defaults(options, {
        report: false,
        onFocusTests: function() {},
        onError: function() {},
        onSettingsChanged: false
      });
      if (process.env.CYPRESS_MEMORY) {
        logMemory = function() {
          return console.log("memory info", process.memoryUsage());
        };
        this.memoryCheck = setInterval(logMemory, 1000);
      }
      return this.getConfig(options).tap((function(_this) {
        return function(cfg) {
          process.chdir(_this.projectRoot);
          if (cfg.pluginsFile) {
            return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg);
          }
        };
      })(this)).then((function(_this) {
        return function(cfg) {
          return _this._initPlugins(cfg, options).then(function(modifiedCfg) {
            debug("plugin config yielded:", modifiedCfg);
            return config.updateWithPluginValues(cfg, modifiedCfg);
          });
        };
      })(this)).then((function(_this) {
        return function(cfg) {
          return _this.server.open(cfg, _this).spread(function(port, warning) {
            if (!cfg.port) {
              cfg.port = port;
              _.extend(cfg, config.setUrls(cfg));
            }
            _this.cfg = cfg;
            debug("project config: %o", _.omit(cfg, "resolved"));
            if (warning) {
              options.onWarning(warning);
            }
            options.onSavedStateChanged = function(state) {
              return _this.saveState(state);
            };
            return Promise.join(_this.watchSettingsAndStartWebsockets(options, cfg), _this.scaffold(cfg)).then(function() {
              return Promise.join(_this.checkSupportFile(cfg), _this.watchPluginsFile(cfg, options));
            });
          });
        };
      })(this))["return"](this);
    };

    Project.prototype._initPlugins = function(cfg, options) {
      cfg = config.whitelist(cfg);
      return plugins.init(cfg, {
        onError: function(err) {
          debug('got plugins error', err.stack);
          browsers.close();
          return options.onError(err);
        }
      });
    };

    Project.prototype.getRuns = function() {
      return Promise.all([this.getProjectId(), user.ensureAuthToken()]).spread(function(projectId, authToken) {
        return api.getProjectRuns(projectId, authToken);
      });
    };

    Project.prototype.reset = function() {
      debug("resetting project instance %s", this.projectRoot);
      this.spec = this.browser = null;
      return Promise["try"]((function(_this) {
        return function() {
          var ref, ref1;
          if ((ref = _this.automation) != null) {
            ref.reset();
          }
          return (ref1 = _this.server) != null ? ref1.reset() : void 0;
        };
      })(this));
    };

    Project.prototype.close = function() {
      var ref, ref1;
      debug("closing project instance %s", this.projectRoot);
      if (this.memoryCheck) {
        clearInterval(this.memoryCheck);
      }
      this.cfg = this.spec = this.browser = null;
      return Promise.join((ref = this.server) != null ? ref.close() : void 0, (ref1 = this.watchers) != null ? ref1.close() : void 0, preprocessor.close()).then(function() {
        return process.chdir(localCwd);
      });
    };

    Project.prototype.checkSupportFile = function(cfg) {
      var supportFile;
      if (supportFile = cfg.supportFile) {
        return fs.pathExists(supportFile).then((function(_this) {
          return function(found) {
            if (!found) {
              return errors["throw"]("SUPPORT_FILE_NOT_FOUND", supportFile);
            }
          };
        })(this));
      }
    };

    Project.prototype.watchPluginsFile = function(cfg, options) {
      debug("attempt watch plugins file: " + cfg.pluginsFile);
      if (!cfg.pluginsFile) {
        return Promise.resolve();
      }
      return fs.pathExists(cfg.pluginsFile).then((function(_this) {
        return function(found) {
          debug("plugins file found? " + found);
          if (!found) {
            return;
          }
          debug("watch plugins file");
          return _this.watchers.watchTree(cfg.pluginsFile, {
            onChange: function() {
              debug("plugins file changed");
              return _this._initPlugins(cfg, options)["catch"](function(err) {
                return options.onError(err);
              });
            }
          });
        };
      })(this));
    };

    Project.prototype.watchSettings = function(onSettingsChanged) {
      var obj;
      if (!onSettingsChanged) {
        return;
      }
      debug("watch settings files");
      obj = {
        onChange: (function(_this) {
          return function(filePath, stats) {
            if (_this.generatedProjectIdTimestamp && (new Date - _this.generatedProjectIdTimestamp) < 1000) {
              return;
            }
            return onSettingsChanged.call(_this);
          };
        })(this)
      };
      this.watchers.watch(settings.pathToCypressJson(this.projectRoot), obj);
      return this.watchers.watch(settings.pathToCypressEnvJson(this.projectRoot), obj);
    };

    Project.prototype.watchSettingsAndStartWebsockets = function(options, cfg) {
      var err, errorMsg, paths, projectRoot, reporter;
      if (options == null) {
        options = {};
      }
      if (cfg == null) {
        cfg = {};
      }
      this.watchSettings(options.onSettingsChanged);
      reporter = cfg.reporter, projectRoot = cfg.projectRoot;
      if (cfg.report) {
        try {
          Reporter.loadReporter(reporter, projectRoot);
        } catch (error) {
          err = error;
          paths = Reporter.getSearchPathsForReporter(reporter, projectRoot);
          errorMsg = err.code === "MODULE_NOT_FOUND" ? err.message : err.stack;
          errors["throw"]("INVALID_REPORTER_NAME", {
            paths: paths,
            error: errorMsg,
            name: reporter
          });
        }
        reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot);
      }
      this.automation = Automation.create(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder);
      return this.server.startWebsockets(this.automation, cfg, {
        onReloadBrowser: options.onReloadBrowser,
        onFocusTests: options.onFocusTests,
        onSpecChanged: options.onSpecChanged,
        onSavedStateChanged: options.onSavedStateChanged,
        onConnect: (function(_this) {
          return function(id) {
            return _this.emit("socket:connected", id);
          };
        })(this),
        onSetRunnables: function(runnables) {
          debug("received runnables %o", runnables);
          return reporter != null ? reporter.setRunnables(runnables) : void 0;
        },
        onMocha: (function(_this) {
          return function(event, runnable) {
            debug("onMocha", event);
            if (!reporter) {
              return;
            }
            reporter.emit(event, runnable);
            if (event === "end") {
              return Promise.all([reporter != null ? reporter.end() : void 0, _this.server.end()]).spread(function(stats) {
                if (stats == null) {
                  stats = {};
                }
                return _this.emit("end", stats);
              });
            }
          };
        })(this)
      });
    };

    Project.prototype.changeToUrl = function(url) {
      return this.server.changeToUrl(url);
    };

    Project.prototype.setCurrentSpecAndBrowser = function(spec, browser) {
      this.spec = spec;
      return this.browser = browser;
    };

    Project.prototype.getCurrentSpecAndBrowser = function() {
      return _.pick(this, "spec", "browser");
    };

    Project.prototype.setBrowsers = function(browsers) {
      if (browsers == null) {
        browsers = [];
      }
      return this.getConfig().then(function(cfg) {
        return cfg.browsers = browsers;
      });
    };

    Project.prototype.getAutomation = function() {
      return this.automation;
    };

    Project.prototype.determineIsNewProject = function(folder) {
      return scaffold.isNewProject(folder);
    };

    Project.prototype.getConfig = function(options) {
      var setNewProject;
      if (options == null) {
        options = {};
      }
      if (this.cfg) {
        return Promise.resolve(this.cfg);
      }
      setNewProject = (function(_this) {
        return function(cfg) {
          if (cfg.isTextTerminal) {
            return;
          }
          if (!cfg.integrationFolder) {
            throw new Error("Missing integration folder");
          }
          return _this.determineIsNewProject(cfg.integrationFolder).then(function(untouchedScaffold) {
            var userHasSeenOnBoarding;
            userHasSeenOnBoarding = _.get(cfg, 'state.showedOnBoardingModal', false);
            scaffoldDebug("untouched scaffold " + untouchedScaffold + " modal closed " + userHasSeenOnBoarding);
            return cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding;
          });
        };
      })(this);
      return config.get(this.projectRoot, options).then((function(_this) {
        return function(cfg) {
          return _this._setSavedState(cfg);
        };
      })(this)).tap(setNewProject);
    };

    Project.prototype.saveState = function(stateChanges) {
      var newState;
      if (stateChanges == null) {
        stateChanges = {};
      }
      if (!this.cfg) {
        throw new Error("Missing project config");
      }
      if (!this.projectRoot) {
        throw new Error("Missing project root");
      }
      newState = _.merge({}, this.cfg.state, stateChanges);
      return savedState(this.projectRoot, this.cfg.isTextTerminal).then(function(state) {
        return state.set(newState);
      }).then((function(_this) {
        return function() {
          _this.cfg.state = newState;
          return newState;
        };
      })(this));
    };

    Project.prototype._setSavedState = function(cfg) {
      debug("get saved state");
      return savedState(this.projectRoot, cfg.isTextTerminal).then(function(state) {
        return state.get();
      }).then(function(state) {
        cfg.state = state;
        return cfg;
      });
    };

    Project.prototype.getSpecUrl = function(absoluteSpecPath) {
      return this.getConfig().then((function(_this) {
        return function(cfg) {
          var prefixedPath;
          if (!absoluteSpecPath || (absoluteSpecPath === "__all")) {
            return _this.normalizeSpecUrl(cfg.browserUrl, "/__all");
          } else {
            prefixedPath = _this.getPrefixedPathToSpec(cfg, absoluteSpecPath);
            return _this.normalizeSpecUrl(cfg.browserUrl, prefixedPath);
          }
        };
      })(this));
    };

    Project.prototype.getPrefixedPathToSpec = function(cfg, pathToSpec, type) {
      var integrationFolder, projectRoot;
      if (type == null) {
        type = "integration";
      }
      integrationFolder = cfg.integrationFolder, projectRoot = cfg.projectRoot;
      return "/" + path.join(type, path.relative(integrationFolder, path.resolve(projectRoot, pathToSpec)));
    };

    Project.prototype.normalizeSpecUrl = function(browserUrl, specUrl) {
      var replacer;
      replacer = function(match, p1) {
        return match.replace("//", "/");
      };
      return [browserUrl, "#/tests", specUrl].join("/").replace(multipleForwardSlashesRe, replacer);
    };

    Project.prototype.scaffold = function(cfg) {
      var push, scaffolds;
      debug("scaffolding project %s", this.projectRoot);
      scaffolds = [];
      push = scaffolds.push.bind(scaffolds);
      push(scaffold.support(cfg.supportFolder, cfg));
      if (!cfg.isTextTerminal) {
        push(scaffold.integration(cfg.integrationFolder, cfg));
        push(scaffold.fixture(cfg.fixturesFolder, cfg));
      }
      return Promise.all(scaffolds);
    };

    Project.prototype.writeProjectId = function(id) {
      var attrs;
      attrs = {
        projectId: id
      };
      logger.info("Writing Project ID", _.clone(attrs));
      this.generatedProjectIdTimestamp = new Date;
      return settings.write(this.projectRoot, attrs)["return"](id);
    };

    Project.prototype.getProjectId = function() {
      return this.verifyExistence().then((function(_this) {
        return function() {
          return settings.read(_this.projectRoot);
        };
      })(this)).then((function(_this) {
        return function(settings) {
          var id;
          if (settings && (id = settings.projectId)) {
            return id;
          }
          return errors["throw"]("NO_PROJECT_ID", _this.projectRoot);
        };
      })(this));
    };

    Project.prototype.verifyExistence = function() {
      return fs.statAsync(this.projectRoot)["return"](this)["catch"]((function(_this) {
        return function() {
          return errors["throw"]("NO_PROJECT_FOUND_AT_PROJECT_ROOT", _this.projectRoot);
        };
      })(this));
    };

    Project.prototype.createCiProject = function(projectDetails) {
      return user.ensureAuthToken().then((function(_this) {
        return function(authToken) {
          return commitInfo.getRemoteOrigin(_this.projectRoot).then(function(remoteOrigin) {
            return api.createProject(projectDetails, remoteOrigin, authToken);
          });
        };
      })(this)).then((function(_this) {
        return function(newProject) {
          return _this.writeProjectId(newProject.id)["return"](newProject);
        };
      })(this));
    };

    Project.prototype.getRecordKeys = function() {
      return Promise.all([this.getProjectId(), user.ensureAuthToken()]).spread(function(projectId, authToken) {
        return api.getProjectRecordKeys(projectId, authToken);
      });
    };

    Project.prototype.requestAccess = function(projectId) {
      return user.ensureAuthToken().then(function(authToken) {
        return api.requestAccess(projectId, authToken);
      });
    };

    Project.getOrgs = function() {
      return user.ensureAuthToken().then(function(authToken) {
        return api.getOrgs(authToken);
      });
    };

    Project.paths = function() {
      return cache.getProjectRoots();
    };

    Project.getPathsAndIds = function() {
      return cache.getProjectRoots().map(function(projectRoot) {
        return Promise.props({
          path: projectRoot,
          id: settings.id(projectRoot)
        });
      });
    };

    Project._mergeDetails = function(clientProject, project) {
      return _.extend({}, clientProject, project, {
        state: "VALID"
      });
    };

    Project._mergeState = function(clientProject, state) {
      return _.extend({}, clientProject, {
        state: state
      });
    };

    Project._getProject = function(clientProject, authToken) {
      debug("get project from api", clientProject.id, clientProject.path);
      return api.getProject(clientProject.id, authToken).then(function(project) {
        debug("got project from api");
        return Project._mergeDetails(clientProject, project);
      })["catch"](function(err) {
        debug("failed to get project from api", err.statusCode);
        switch (err.statusCode) {
          case 404:
            return Project._mergeState(clientProject, "INVALID");
          case 403:
            return Project._mergeState(clientProject, "UNAUTHORIZED");
          default:
            throw err;
        }
      });
    };

    Project.getProjectStatuses = function(clientProjects) {
      if (clientProjects == null) {
        clientProjects = [];
      }
      debug("get project statuses for " + clientProjects.length + " projects");
      return user.ensureAuthToken().then(function(authToken) {
        debug("got auth token " + authToken);
        return api.getProjects(authToken).then(function(projects) {
          var projectsIndex;
          if (projects == null) {
            projects = [];
          }
          debug("got " + projects.length + " projects");
          projectsIndex = _.keyBy(projects, "id");
          return Promise.all(_.map(clientProjects, function(clientProject) {
            var project;
            debug("looking at", clientProject.path);
            if (!clientProject.id) {
              debug("no project id");
              return Project._mergeState(clientProject, "VALID");
            }
            if (project = projectsIndex[clientProject.id]) {
              debug("found matching:", project);
              return Project._mergeDetails(clientProject, project);
            } else {
              debug("did not find matching:", project);
              return Project._getProject(clientProject, authToken);
            }
          }));
        });
      });
    };

    Project.getProjectStatus = function(clientProject) {
      debug("get project status for", clientProject.id, clientProject.path);
      if (!clientProject.id) {
        debug("no project id");
        return Promise.resolve(Project._mergeState(clientProject, "VALID"));
      }
      return user.ensureAuthToken().then(function(authToken) {
        debug("got auth token " + authToken);
        return Project._getProject(clientProject, authToken);
      });
    };

    Project.remove = function(path) {
      return cache.removeProject(path);
    };

    Project.add = function(path) {
      return cache.insertProject(path).then((function(_this) {
        return function() {
          return _this.id(path);
        };
      })(this)).then(function(id) {
        return {
          id: id,
          path: path
        };
      })["catch"](function() {
        return {
          path: path
        };
      });
    };

    Project.id = function(path) {
      return Project(path).getProjectId();
    };

    Project.ensureExists = function(path) {
      return settings.exists(path);
    };

    Project.config = function(path) {
      return Project(path).getConfig();
    };

    Project.getSecretKeyByPath = function(path) {
      return Project.id(path).then(function(id) {
        return user.ensureAuthToken().then(function(authToken) {
          return api.getProjectToken(id, authToken)["catch"](function() {
            return errors["throw"]("CANNOT_FETCH_PROJECT_TOKEN");
          });
        });
      });
    };

    Project.generateSecretKeyByPath = function(path) {
      return Project.id(path).then(function(id) {
        return user.ensureAuthToken().then(function(authToken) {
          return api.updateProjectToken(id, authToken)["catch"](function() {
            return errors["throw"]("CANNOT_CREATE_PROJECT_TOKEN");
          });
        });
      });
    };

    Project.findSpecs = function(projectRoot, specPattern) {
      debug("finding specs for project %s", projectRoot);
      la(check.unemptyString(projectRoot), "missing project path", projectRoot);
      la(check.maybe.unemptyString(specPattern), "invalid spec pattern", specPattern);
      if (specPattern) {
        specPattern = path.resolve(projectRoot, specPattern);
      }
      return Project(projectRoot).getConfig().then(function(cfg) {
        return specsUtil.find(cfg, specPattern);
      }).then(R.prop("integration")).then(R.map(R.prop("name")));
    };

    return Project;

  })(EE);

  module.exports = Project;

}).call(this);
