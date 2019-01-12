(function() {
  var Mocha, Promise, Reporter, STATS, _, chalk, createRunnable, createSuite, debug, events, getParentTitle, mergeErr, mergeRunnable, mochaReporters, path, reporters, safelyMergeRunnable, setDate,
    slice = [].slice;

  _ = require("lodash");

  path = require("path");

  chalk = require("chalk");

  Mocha = require("mocha");

  debug = require("debug")("cypress:server:reporter");

  Promise = require("bluebird");

  mochaReporters = require("mocha/lib/reporters");

  STATS = "suites tests passes pending failures start end duration".split(" ");

  if (Mocha.Suite.prototype.titlePath) {
    throw new Error('Mocha.Suite.prototype.titlePath already exists. Please remove the monkeypatch code.');
  }

  Mocha.Suite.prototype.titlePath = function() {
    var result;
    result = [];
    if (this.parent) {
      result = result.concat(this.parent.titlePath());
    }
    if (!this.root) {
      result.push(this.title);
    }
    return result;
  };

  Mocha.Runnable.prototype.titlePath = function() {
    return this.parent.titlePath().concat([this.title]);
  };

  getParentTitle = function(runnable, titles) {
    var p, t;
    if (!titles) {
      titles = [runnable.title];
    }
    if (p = runnable.parent) {
      if (t = p.title) {
        titles.unshift(t);
      }
      return getParentTitle(p, titles);
    } else {
      return titles;
    }
  };

  createSuite = function(obj, parent) {
    var suite;
    suite = new Mocha.Suite(obj.title, {});
    if (parent) {
      suite.parent = parent;
    }
    if (obj.file) {
      console.log('has file:', obj.file);
    }
    suite.file = obj.file;
    return suite;
  };

  createRunnable = function(obj, parent) {
    var body, fn, ref, runnable;
    body = obj.body;
    if (body) {
      fn = function() {};
      fn.toString = function() {
        return body;
      };
    }
    runnable = new Mocha.Test(obj.title, fn);
    runnable.timedOut = obj.timedOut;
    runnable.async = obj.async;
    runnable.sync = obj.sync;
    runnable.duration = obj.duration;
    runnable.state = (ref = obj.state) != null ? ref : "skipped";
    if (runnable.body == null) {
      runnable.body = body;
    }
    if (parent) {
      runnable.parent = parent;
    }
    return runnable;
  };

  mergeRunnable = function(eventName) {
    return function(testProps, runnables) {
      var runnable;
      runnable = runnables[testProps.id];
      return _.extend(runnable, testProps);
    };
  };

  safelyMergeRunnable = function(hookProps, runnables) {
    var body, hookId, hookName, runnable, title, type;
    hookId = hookProps.hookId, title = hookProps.title, hookName = hookProps.hookName, body = hookProps.body, type = hookProps.type;
    if (!(runnable = runnables[hookId])) {
      runnables[hookId] = {
        hookId: hookId,
        type: type,
        title: title,
        body: body,
        hookName: hookName
      };
    }
    return _.extend({}, runnables[hookProps.id], hookProps);
  };

  mergeErr = function(runnable, runnables, stats) {
    var test;
    test = runnables[runnable.id];
    test.err = runnable.err;
    test.state = "failed";
    if (test.duration == null) {
      test.duration = test.duration;
    }
    if (runnable.type === "hook") {
      test.failedFromHookId = runnable.hookId;
    }
    test = _.extend({}, test, {
      title: runnable.title
    });
    return [test, test.err];
  };

  setDate = function(obj, runnables, stats) {
    var e, s;
    if (s = obj.start) {
      stats.wallClockStartedAt = new Date(s);
    }
    if (e = obj.end) {
      stats.wallClockEndedAt = new Date(e);
    }
    return null;
  };

  events = {
    "start": setDate,
    "end": setDate,
    "suite": mergeRunnable("suite"),
    "suite end": mergeRunnable("suite end"),
    "test": mergeRunnable("test"),
    "test end": mergeRunnable("test end"),
    "hook": safelyMergeRunnable,
    "hook end": safelyMergeRunnable,
    "pass": mergeRunnable("pass"),
    "pending": mergeRunnable("pending"),
    "fail": mergeErr,
    "test:after:run": mergeRunnable("test:after:run")
  };

  reporters = {
    teamcity: "@cypress/mocha-teamcity-reporter",
    junit: "mocha-junit-reporter"
  };

  Reporter = (function() {
    function Reporter(reporterName, reporterOptions, projectRoot) {
      if (reporterName == null) {
        reporterName = "spec";
      }
      if (reporterOptions == null) {
        reporterOptions = {};
      }
      if (!(this instanceof Reporter)) {
        return new Reporter(reporterName);
      }
      this.reporterName = reporterName;
      this.projectRoot = projectRoot;
      this.reporterOptions = reporterOptions;
    }

    Reporter.prototype.setRunnables = function(rootRunnable) {
      var reporter;
      if (rootRunnable == null) {
        rootRunnable = {};
      }
      this.stats = {
        suites: 0,
        tests: 0,
        passes: 0,
        pending: 0,
        skipped: 0,
        failures: 0
      };
      this.runnables = {};
      rootRunnable = this._createRunnable(rootRunnable, "suite");
      reporter = Reporter.loadReporter(this.reporterName, this.projectRoot);
      this.mocha = new Mocha({
        reporter: reporter
      });
      this.mocha.suite = rootRunnable;
      this.runner = new Mocha.Runner(rootRunnable);
      this.reporter = new this.mocha._reporter(this.runner, {
        reporterOptions: this.reporterOptions
      });
      return this.runner.ignoreLeaks = true;
    };

    Reporter.prototype._createRunnable = function(runnableProps, type, parent) {
      var runnable, suite;
      runnable = (function() {
        switch (type) {
          case "suite":
            suite = createSuite(runnableProps, parent);
            suite.tests = _.map(runnableProps.tests, (function(_this) {
              return function(testProps) {
                return _this._createRunnable(testProps, "test", suite);
              };
            })(this));
            suite.suites = _.map(runnableProps.suites, (function(_this) {
              return function(suiteProps) {
                return _this._createRunnable(suiteProps, "suite", suite);
              };
            })(this));
            return suite;
          case "test":
            return createRunnable(runnableProps, parent);
          default:
            throw new Error("Unknown runnable type: '" + type + "'");
        }
      }).call(this);
      runnable.id = runnableProps.id;
      this.runnables[runnableProps.id] = runnable;
      return runnable;
    };

    Reporter.prototype.emit = function() {
      var args, event, ref;
      event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (args = this.parseArgs(event, args)) {
        return (ref = this.runner) != null ? ref.emit.apply(this.runner, args) : void 0;
      }
    };

    Reporter.prototype.parseArgs = function(event, args) {
      var e;
      if (e = events[event]) {
        if (_.isFunction(e)) {
          debug("got mocha event '%s' with args: %o", event, args);
          args = e.apply(this, args.concat(this.runnables, this.stats));
        }
        return [event].concat(args);
      }
    };

    Reporter.prototype.normalizeHook = function(hook) {
      if (hook == null) {
        hook = {};
      }
      return {
        hookId: hook.hookId,
        hookName: hook.hookName,
        title: getParentTitle(hook),
        body: hook.body
      };
    };

    Reporter.prototype.normalizeTest = function(test) {
      var get, wcs;
      if (test == null) {
        test = {};
      }
      get = function(prop) {
        return _.get(test, prop, null);
      };
      if (wcs = get("wallClockStartedAt")) {
        wcs = new Date(wcs);
      }
      return {
        testId: get("id"),
        title: getParentTitle(test),
        state: get("state"),
        body: get("body"),
        stack: get("err.stack"),
        error: get("err.message"),
        timings: get("timings"),
        failedFromHookId: get("failedFromHookId"),
        wallClockStartedAt: wcs,
        wallClockDuration: get("wallClockDuration"),
        videoTimestamp: null
      };
    };

    Reporter.prototype.end = function() {
      var failures;
      if (this.reporter.done) {
        failures = this.runner.failures;
        return new Promise((function(_this) {
          return function(resolve, reject) {
            return _this.reporter.done(failures, resolve);
          };
        })(this)).then((function(_this) {
          return function() {
            return _this.results();
          };
        })(this));
      } else {
        return this.results();
      }
    };

    Reporter.prototype.results = function() {
      var hooks, ref, suites, tests, wallClockEndedAt, wallClockStartedAt;
      tests = _.chain(this.runnables).filter({
        type: "test"
      }).map(this.normalizeTest).value();
      hooks = _.chain(this.runnables).filter({
        type: "hook"
      }).map(this.normalizeHook).value();
      suites = _.chain(this.runnables).filter({
        root: false
      }).value();
      this.stats.wallClockDuration = 0;
      ref = this.stats, wallClockStartedAt = ref.wallClockStartedAt, wallClockEndedAt = ref.wallClockEndedAt;
      if (wallClockStartedAt && wallClockEndedAt) {
        this.stats.wallClockDuration = wallClockEndedAt - wallClockStartedAt;
      }
      this.stats.suites = suites.length;
      this.stats.tests = tests.length;
      this.stats.passes = _.filter(tests, {
        state: "passed"
      }).length;
      this.stats.pending = _.filter(tests, {
        state: "pending"
      }).length;
      this.stats.skipped = _.filter(tests, {
        state: "skipped"
      }).length;
      this.stats.failures = _.filter(tests, {
        state: "failed"
      }).length;
      return {
        stats: this.stats,
        reporter: this.reporterName,
        reporterStats: this.runner.stats,
        hooks: hooks,
        tests: tests
      };
    };

    Reporter.setVideoTimestamp = function(videoStart, tests) {
      if (tests == null) {
        tests = [];
      }
      return _.map(tests, function(test) {
        var wcs;
        if (wcs = test.wallClockStartedAt) {
          test.videoTimestamp = test.wallClockStartedAt - videoStart;
        }
        return test;
      });
    };

    Reporter.create = function(reporterName, reporterOptions, projectRoot) {
      return new Reporter(reporterName, reporterOptions, projectRoot);
    };

    Reporter.loadReporter = function(reporterName, projectRoot) {
      var err, p, r;
      debug("trying to load reporter:", reporterName);
      if (r = reporters[reporterName]) {
        debug(reporterName + " is built-in reporter");
        return require(r);
      }
      if (mochaReporters[reporterName]) {
        debug(reporterName + " is Mocha reporter");
        return reporterName;
      }
      try {
        p = path.resolve(projectRoot, reporterName);
        debug("trying to require local reporter with path:", p);
        return require(p);
      } catch (error) {
        err = error;
        if (err.code !== "MODULE_NOT_FOUND") {
          throw err;
        }
        p = path.resolve(projectRoot, "node_modules", reporterName);
        debug("trying to require local reporter with path:", p);
        return require(p);
      }
    };

    Reporter.getSearchPathsForReporter = function(reporterName, projectRoot) {
      return _.uniq([path.resolve(projectRoot, reporterName), path.resolve(projectRoot, "node_modules", reporterName)]);
    };

    return Reporter;

  })();

  module.exports = Reporter;

}).call(this);
