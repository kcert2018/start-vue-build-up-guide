(function() {
  var Project, Promise, Reporter, Windows, _, browsers, chalk, collectTestResults, color, colorIf, createAndOpenProject, debug, displayRunStarting, displaySpecHeader, duration, electronApp, env, errors, formatBrowser, formatFooterSummary, formatRecordParams, formatSpecPattern, formatSpecSummary, formatSpecs, fs, getProjectId, getRun, getSymbol, gray, human, humanTime, iterateThroughSpecs, logSymbols, openProject, openProjectCreate, path, pkg, random, recordMode, reduceRuns, removeOldProfiles, renderSummaryTable, specsUtil, system, terminal, trash, trashAssets, uuid, videoCapture, writeOutput;

  _ = require("lodash");

  pkg = require("@packages/root");

  uuid = require("uuid");

  path = require("path");

  chalk = require("chalk");

  human = require("human-interval");

  debug = require("debug")("cypress:server:run");

  Promise = require("bluebird");

  logSymbols = require("log-symbols");

  recordMode = require("./record");

  errors = require("../errors");

  Project = require("../project");

  Reporter = require("../reporter");

  browsers = require("../browsers");

  openProject = require("../open_project");

  videoCapture = require("../video_capture");

  Windows = require("../gui/windows");

  fs = require("../util/fs");

  env = require("../util/env");

  trash = require("../util/trash");

  random = require("../util/random");

  system = require("../util/system");

  duration = require("../util/duration");

  terminal = require("../util/terminal");

  specsUtil = require("../util/specs");

  humanTime = require("../util/human_time");

  electronApp = require("../util/electron_app");

  color = function(val, c) {
    return chalk[c](val);
  };

  gray = function(val) {
    return color(val, "gray");
  };

  colorIf = function(val, c) {
    if (val === 0) {
      val = "-";
      c = "gray";
    }
    return color(val, c);
  };

  getSymbol = function(num) {
    if (num) {
      return logSymbols.error;
    } else {
      return logSymbols.success;
    }
  };

  formatBrowser = function(browser) {
    return _.compact([browser.displayName, browser.majorVersion, browser.isHeadless && gray("(headless)")]).join(" ");
  };

  formatFooterSummary = function(results) {
    var c, phrase, runs, totalFailed;
    totalFailed = results.totalFailed, runs = results.runs;
    c = totalFailed ? "red" : "green";
    phrase = (function() {
      var failingRuns, percent, total;
      if (!totalFailed) {
        return "All specs passed!";
      }
      total = runs.length;
      failingRuns = _.filter(runs, "stats.failures").length;
      percent = Math.round(failingRuns / total * 100);
      return failingRuns + " of " + total + " failed (" + percent + "%)";
    })();
    return [color(phrase, c), gray(duration.format(results.totalDuration)), colorIf(results.totalTests, "reset"), colorIf(results.totalPassed, "green"), colorIf(totalFailed, "red"), colorIf(results.totalPending, "cyan"), colorIf(results.totalSkipped, "blue")];
  };

  formatSpecSummary = function(name, failures) {
    return [getSymbol(failures), color(name, "reset")].join(" ");
  };

  formatRecordParams = function(runUrl, parallel, group) {
    if (runUrl) {
      group || (group = false);
      return "Group: " + group + ", Parallel: " + (Boolean(parallel));
    }
  };

  formatSpecPattern = function(specPattern) {
    if (specPattern) {
      return specPattern.join(", ");
    }
  };

  formatSpecs = function(specs) {
    var names;
    names = _.map(specs, "name");
    return [names.length + " found ", gray("("), gray(names.join(', ')), gray(")")].join("");
  };

  displayRunStarting = function(options) {
    var browser, data, group, parallel, runUrl, specPattern, specs, table;
    if (options == null) {
      options = {};
    }
    specs = options.specs, specPattern = options.specPattern, browser = options.browser, runUrl = options.runUrl, parallel = options.parallel, group = options.group;
    console.log("");
    terminal.divider("=");
    console.log("");
    terminal.header("Run Starting", {
      color: ["reset"]
    });
    console.log("");
    table = terminal.table({
      colWidths: [12, 88],
      type: "outsideBorder"
    });
    data = _.chain([[gray("Cypress:"), pkg.version], [gray("Browser:"), formatBrowser(browser)], [gray("Specs:"), formatSpecs(specs)], [gray("Searched:"), formatSpecPattern(specPattern)], [gray("Params:"), formatRecordParams(runUrl, parallel, group)], [gray("Run URL:"), runUrl]]).filter(_.property(1)).value();
    table.push.apply(table, data);
    console.log(table.toString());
    return console.log("");
  };

  displaySpecHeader = function(name, curr, total, estimated) {
    var PADDING, estimatedLabel, table;
    console.log("");
    PADDING = 2;
    table = terminal.table({
      colWidths: [80, 20],
      colAligns: ["left", "right"],
      type: "pageDivider",
      style: {
        "padding-left": PADDING
      }
    });
    table.push(["", ""]);
    table.push(["Running: " + gray(name + "..."), gray("(" + curr + " of " + total + ")")]);
    console.log(table.toString());
    if (estimated) {
      estimatedLabel = " ".repeat(PADDING) + "Estimated:";
      return console.log(estimatedLabel, gray(humanTime.long(estimated)));
    }
  };

  collectTestResults = function(obj, estimated) {
    if (obj == null) {
      obj = {};
    }
    return {
      name: _.get(obj, 'spec.name'),
      tests: _.get(obj, 'stats.tests'),
      passes: _.get(obj, 'stats.passes'),
      pending: _.get(obj, 'stats.pending'),
      failures: _.get(obj, 'stats.failures'),
      skipped: _.get(obj, 'stats.skipped'),
      duration: humanTime.long(_.get(obj, 'stats.wallClockDuration')),
      estimated: estimated && humanTime.long(estimated),
      screenshots: obj.screenshots && obj.screenshots.length,
      video: Boolean(obj.video)
    };
  };

  renderSummaryTable = function(runUrl) {
    return function(results) {
      var colAligns, colWidths, head, runs, table1, table2, table3, table4;
      runs = results.runs;
      console.log("");
      terminal.divider("=");
      console.log("");
      terminal.header("Run Finished", {
        color: ["reset"]
      });
      if (runs && runs.length) {
        head = ["  Spec", "", "Tests", "Passing", "Failing", "Pending", "Skipped"];
        colAligns = ["left", "right", "right", "right", "right", "right", "right"];
        colWidths = [39, 11, 10, 10, 10, 10, 10];
        table1 = terminal.table({
          colAligns: colAligns,
          colWidths: colWidths,
          type: "noBorder",
          head: _.map(head, gray)
        });
        table2 = terminal.table({
          colAligns: colAligns,
          colWidths: colWidths,
          type: "border"
        });
        table3 = terminal.table({
          colAligns: colAligns,
          colWidths: colWidths,
          type: "noBorder",
          head: formatFooterSummary(results),
          style: {
            "padding-right": 2
          }
        });
        _.each(runs, function(run) {
          var ms, spec, stats;
          spec = run.spec, stats = run.stats;
          ms = duration.format(stats.wallClockDuration);
          return table2.push([formatSpecSummary(spec.name, stats.failures), color(ms, "gray"), colorIf(stats.tests, "reset"), colorIf(stats.passes, "green"), colorIf(stats.failures, "red"), colorIf(stats.pending, "cyan"), colorIf(stats.skipped, "blue")]);
        });
        console.log("");
        console.log("");
        console.log(terminal.renderTables(table1, table2, table3));
        console.log("");
        if (runUrl) {
          console.log("");
          table4 = terminal.table({
            colWidths: [100],
            type: "pageDivider",
            style: {
              "padding-left": 2
            }
          });
          table4.push(["", ""]);
          table4.push(["Recorded Run: " + gray(runUrl)]);
          console.log(terminal.renderTables(table4));
          return console.log("");
        }
      }
    };
  };

  iterateThroughSpecs = function(options) {
    var afterSpecRun, beforeSpecRun, config, parallel, parallelWithRecord, runEachSpec, serial, serialWithRecord, specs;
    if (options == null) {
      options = {};
    }
    specs = options.specs, runEachSpec = options.runEachSpec, parallel = options.parallel, beforeSpecRun = options.beforeSpecRun, afterSpecRun = options.afterSpecRun, config = options.config;
    serial = function() {
      return Promise.mapSeries(specs, runEachSpec);
    };
    serialWithRecord = function() {
      return Promise.mapSeries(specs, function(spec, index, length) {
        return beforeSpecRun(spec).then(function(arg1) {
          var estimated;
          estimated = arg1.estimated;
          return runEachSpec(spec, index, length, estimated);
        }).tap(function(results) {
          return afterSpecRun(spec, results, config);
        });
      });
    };
    parallelWithRecord = function(runs) {
      return beforeSpecRun().then(function(arg1) {
        var claimedInstances, estimated, spec, totalInstances;
        spec = arg1.spec, claimedInstances = arg1.claimedInstances, totalInstances = arg1.totalInstances, estimated = arg1.estimated;
        if (!spec) {
          return runs;
        }
        spec = _.find(specs, {
          relative: spec
        });
        return runEachSpec(spec, claimedInstances - 1, totalInstances, estimated).tap(function(results) {
          runs.push(results);
          return afterSpecRun(spec, results, config);
        }).then(function() {
          return parallelWithRecord(runs);
        });
      });
    };
    switch (false) {
      case !parallel:
        return parallelWithRecord([]);
      case !beforeSpecRun:
        return serialWithRecord();
      default:
        return serial();
    }
  };

  getProjectId = function(project, id) {
    if (id == null) {
      id = env.get("CYPRESS_PROJECT_ID");
    }
    if (id) {
      return Promise.resolve(id);
    }
    return project.getProjectId()["catch"](function() {
      return null;
    });
  };

  reduceRuns = function(runs, prop) {
    return _.reduce(runs, function(memo, run) {
      return memo += _.get(run, prop);
    }, 0);
  };

  getRun = function(run, prop) {
    return _.get(run, prop);
  };

  writeOutput = function(outputPath, results) {
    return Promise["try"](function() {
      if (!outputPath) {
        return;
      }
      debug("saving output results as %s", outputPath);
      return fs.outputJsonAsync(outputPath, results);
    });
  };

  openProjectCreate = function(projectRoot, socketId, options) {
    return openProject.create(projectRoot, options, {
      socketId: socketId,
      morgan: false,
      report: true,
      isTextTerminal: options.isTextTerminal,
      onError: function(err) {
        console.log("");
        console.log(err.stack);
        return openProject.emit("exitEarlyWithErr", err.message);
      }
    })["catch"]({
      portInUse: true
    }, function(err) {
      return errors["throw"]("PORT_IN_USE_LONG", err.port);
    });
  };

  createAndOpenProject = function(socketId, options) {
    var projectId, projectRoot;
    projectRoot = options.projectRoot, projectId = options.projectId;
    return Project.ensureExists(projectRoot).then(function() {
      return openProjectCreate(projectRoot, socketId, options).call("getProject");
    }).then(function(project) {
      return Promise.props({
        project: project,
        config: project.getConfig(),
        projectId: getProjectId(project, projectId)
      });
    });
  };

  removeOldProfiles = function() {
    return browsers.removeOldProfiles()["catch"](function(err) {
      return errors.warning("CANNOT_REMOVE_OLD_BROWSER_PROFILES", err.stack);
    });
  };

  trashAssets = function(config) {
    if (config == null) {
      config = {};
    }
    if (config.trashAssetsBeforeRuns !== true) {
      return Promise.resolve();
    }
    return Promise.join(trash.folder(config.videosFolder), trash.folder(config.screenshotsFolder))["catch"](function(err) {
      return errors.warning("CANNOT_TRASH_ASSETS", err.stack);
    });
  };

  module.exports = {
    collectTestResults: collectTestResults,
    getProjectId: getProjectId,
    writeOutput: writeOutput,
    openProjectCreate: openProjectCreate,
    createRecording: function(name) {
      var outputDir;
      outputDir = path.dirname(name);
      return fs.ensureDirAsync(outputDir).then(function() {
        return videoCapture.start(name, {
          onError: function(err) {
            return errors.warning("VIDEO_RECORDING_FAILED", err.stack);
          }
        });
      });
    },
    getElectronProps: function(isHeaded, project, write) {
      var obj;
      obj = {
        width: 1280,
        height: 720,
        show: isHeaded,
        onCrashed: function() {
          var err;
          err = errors.get("RENDERER_CRASHED");
          errors.log(err);
          return project.emit("exitEarlyWithErr", err.message);
        },
        onNewWindow: function(e, url, frameName, disposition, options) {
          return options.show = false;
        }
      };
      if (write) {
        obj.recordFrameRate = 20;
        obj.onPaint = function(event, dirty, image) {
          return write(image.toJPEG(100));
        };
      }
      return obj;
    },
    displayResults: function(obj, estimated) {
      var c, data, results, table;
      if (obj == null) {
        obj = {};
      }
      results = collectTestResults(obj, estimated);
      c = results.failures ? "red" : "green";
      console.log("");
      terminal.header("Results", {
        color: [c]
      });
      table = terminal.table({
        type: "outsideBorder"
      });
      data = _.chain([["Tests:", results.tests], ["Passing:", results.passes], ["Failing:", results.failures], ["Pending:", results.pending], ["Skipped:", results.skipped], ["Screenshots:", results.screenshots], ["Video:", results.video], ["Duration:", results.duration], estimated ? ["Estimated:", results.estimated] : void 0, ["Spec Ran:", results.name]]).compact().map(function(arr) {
        var key, val;
        key = arr[0], val = arr[1];
        return [color(key, "gray"), color(val, c)];
      }).value();
      table.push.apply(table, data);
      console.log("");
      console.log(table.toString());
      return console.log("");
    },
    displayScreenshots: function(screenshots) {
      var format;
      if (screenshots == null) {
        screenshots = [];
      }
      console.log("");
      terminal.header("Screenshots", {
        color: ["yellow"]
      });
      console.log("");
      format = function(s) {
        var dimensions;
        dimensions = gray("(" + s.width + "x" + s.height + ")");
        return "  - " + s.path + " " + dimensions;
      };
      screenshots.forEach(function(screenshot) {
        return console.log(format(screenshot));
      });
      return console.log("");
    },
    postProcessRecording: function(end, name, cname, videoCompression, shouldUploadVideo) {
      debug("ending the video recording %o", {
        name: name,
        videoCompression: videoCompression,
        shouldUploadVideo: shouldUploadVideo
      });
      return end().then(function() {
        var onProgress, progress, started, throttle;
        if (videoCompression === false || shouldUploadVideo === false) {
          return;
        }
        console.log("");
        terminal.header("Video", {
          color: ["cyan"]
        });
        console.log("");
        console.log(gray("  - Started processing:  "), chalk.cyan("Compressing to " + videoCompression + " CRF"));
        started = new Date;
        progress = Date.now();
        throttle = env.get("VIDEO_COMPRESSION_THROTTLE") || human("10 seconds");
        onProgress = function(float) {
          var dur, finished, percentage;
          switch (false) {
            case float !== 1:
              finished = new Date - started;
              dur = "(" + (humanTime.long(finished)) + ")";
              console.log(gray("  - Finished processing: "), chalk.cyan(name), gray(dur));
              return console.log("");
            case !((new Date - progress) > throttle):
              progress += throttle;
              percentage = Math.ceil(float * 100) + "%";
              return console.log("  - Compression progress: ", chalk.cyan(percentage));
          }
        };
        return videoCapture.process(name, cname, videoCompression, onProgress);
      })["catch"]({
        recordingVideoFailed: true
      }, function(err) {})["catch"](function(err) {
        return errors.warning("VIDEO_POST_PROCESSING_FAILED", err.stack);
      });
    },
    launchBrowser: function(options) {
      var browser, browserOpts, project, projectRoot, screenshots, spec, write;
      if (options == null) {
        options = {};
      }
      browser = options.browser, spec = options.spec, write = options.write, project = options.project, screenshots = options.screenshots, projectRoot = options.projectRoot;
      browserOpts = (function() {
        switch (browser.name) {
          case "electron":
            return this.getElectronProps(browser.isHeaded, project, write);
          default:
            return {};
        }
      }).call(this);
      browserOpts.automationMiddleware = {
        onAfterResponse: (function(_this) {
          return function(message, data, resp) {
            if (message === "take:screenshot" && resp) {
              screenshots.push(_this.screenshotMetadata(data, resp));
            }
            return resp;
          };
        })(this)
      };
      browserOpts.projectRoot = projectRoot;
      return openProject.launch(browser, spec, browserOpts);
    },
    listenForProjectEnd: function(project, exit) {
      return new Promise(function(resolve) {
        var onEarlyExit, onEnd;
        if (exit === false) {
          resolve = function(arg) {
            return console.log("not exiting due to options.exit being false");
          };
        }
        onEarlyExit = function(errMsg) {
          var obj;
          obj = {
            error: errors.stripAnsi(errMsg),
            stats: {
              failures: 1,
              tests: 0,
              passes: 0,
              pending: 0,
              suites: 0,
              skipped: 0,
              wallClockDuration: 0,
              wallClockStartedAt: (new Date()).toJSON(),
              wallClockEndedAt: (new Date()).toJSON()
            }
          };
          return resolve(obj);
        };
        onEnd = function(obj) {
          return resolve(obj);
        };
        project.once("end", onEnd);
        return project.once("exitEarlyWithErr", onEarlyExit);
      });
    },
    waitForBrowserToConnect: function(options) {
      var attempts, project, socketId, timeout, waitForBrowserToConnect;
      if (options == null) {
        options = {};
      }
      project = options.project, socketId = options.socketId, timeout = options.timeout;
      attempts = 0;
      return (waitForBrowserToConnect = (function(_this) {
        return function() {
          return Promise.join(_this.waitForSocketConnection(project, socketId), _this.launchBrowser(options)).timeout(timeout != null ? timeout : 30000)["catch"](Promise.TimeoutError, function(err) {
            attempts += 1;
            console.log("");
            return openProject.closeBrowser().then(function() {
              var word;
              switch (attempts) {
                case 1:
                case 2:
                  word = attempts === 1 ? "Retrying..." : "Retrying again...";
                  errors.warning("TESTS_DID_NOT_START_RETRYING", word);
                  return waitForBrowserToConnect();
                default:
                  err = errors.get("TESTS_DID_NOT_START_FAILED");
                  errors.log(err);
                  return project.emit("exitEarlyWithErr", err.message);
              }
            });
          });
        };
      })(this))();
    },
    waitForSocketConnection: function(project, id) {
      debug("waiting for socket connection... %o", {
        id: id
      });
      return new Promise(function(resolve, reject) {
        var fn;
        fn = function(socketId) {
          debug("got socket connection %o", {
            id: socketId
          });
          if (socketId === id) {
            project.removeListener("socket:connected", fn);
            return resolve();
          }
        };
        return project.on("socket:connected", fn);
      });
    },
    waitForTestsToFinishRunning: function(options) {
      var cname, end, estimated, exit, name, project, screenshots, spec, started, videoCompression, videoUploadOnPasses;
      if (options == null) {
        options = {};
      }
      project = options.project, screenshots = options.screenshots, started = options.started, end = options.end, name = options.name, cname = options.cname, videoCompression = options.videoCompression, videoUploadOnPasses = options.videoUploadOnPasses, exit = options.exit, spec = options.spec, estimated = options.estimated;
      return this.listenForProjectEnd(project, exit).then((function(_this) {
        return function(obj) {
          var failingTests, finish, hasFailingTests, stats, suv, tests;
          _.defaults(obj, {
            error: null,
            hooks: null,
            tests: null,
            video: null,
            screenshots: null,
            reporterStats: null
          });
          if (end) {
            obj.video = name;
          }
          if (screenshots) {
            obj.screenshots = screenshots;
          }
          obj.spec = spec;
          finish = function() {
            return obj;
          };
          _this.displayResults(obj, estimated);
          if (screenshots && screenshots.length) {
            _this.displayScreenshots(screenshots);
          }
          tests = obj.tests, stats = obj.stats;
          failingTests = _.filter(tests, {
            state: "failed"
          });
          hasFailingTests = _.get(stats, 'failures') > 0;
          if (started && tests && tests.length) {
            obj.tests = Reporter.setVideoTimestamp(started, tests);
          }
          suv = Boolean(videoUploadOnPasses === true || (started && hasFailingTests));
          obj.shouldUploadVideo = suv;
          debug("attempting to close the browser");
          return openProject.closeBrowser().then(function() {
            if (end) {
              return _this.postProcessRecording(end, name, cname, videoCompression, suv).then(finish);
            } else {
              return finish();
            }
          });
        };
      })(this));
    },
    screenshotMetadata: function(data, resp) {
      var ref;
      return {
        screenshotId: random.id(),
        name: (ref = data.name) != null ? ref : null,
        testId: data.testId,
        takenAt: resp.takenAt,
        path: resp.path,
        height: resp.dimensions.height,
        width: resp.dimensions.width
      };
    },
    runSpecs: function(options) {
      var afterSpecRun, beforeSpecRun, browser, config, group, headed, isHeadless, outputPath, parallel, results, runEachSpec, runUrl, specPattern, specs, sys;
      if (options == null) {
        options = {};
      }
      config = options.config, browser = options.browser, sys = options.sys, headed = options.headed, outputPath = options.outputPath, specs = options.specs, specPattern = options.specPattern, beforeSpecRun = options.beforeSpecRun, afterSpecRun = options.afterSpecRun, runUrl = options.runUrl, parallel = options.parallel, group = options.group;
      isHeadless = browser.name === "electron" && !headed;
      browser.isHeadless = isHeadless;
      browser.isHeaded = !isHeadless;
      results = {
        startedTestsAt: null,
        endedTestsAt: null,
        totalDuration: null,
        totalSuites: null,
        totalTests: null,
        totalFailed: null,
        totalPassed: null,
        totalPending: null,
        totalSkipped: null,
        runs: null,
        browserPath: browser.path,
        browserName: browser.name,
        browserVersion: browser.version,
        osName: sys.osName,
        osVersion: sys.osVersion,
        cypressVersion: pkg.version,
        runUrl: runUrl,
        config: config
      };
      displayRunStarting({
        specs: specs,
        group: group,
        runUrl: runUrl,
        browser: browser,
        parallel: parallel,
        specPattern: specPattern
      });
      runEachSpec = (function(_this) {
        return function(spec, index, length, estimated) {
          displaySpecHeader(spec.name, index + 1, length, estimated);
          return _this.runSpec(spec, options, estimated).get("results").tap(function(results) {
            return debug("spec results %o", results);
          });
        };
      })(this);
      return iterateThroughSpecs({
        specs: specs,
        config: config,
        parallel: parallel,
        runEachSpec: runEachSpec,
        afterSpecRun: afterSpecRun,
        beforeSpecRun: beforeSpecRun
      }).then(function(runs) {
        var end, start;
        if (runs == null) {
          runs = [];
        }
        results.startedTestsAt = start = getRun(_.first(runs), "stats.wallClockStartedAt");
        results.endedTestsAt = end = getRun(_.last(runs), "stats.wallClockEndedAt");
        results.totalDuration = reduceRuns(runs, "stats.wallClockDuration");
        results.totalSuites = reduceRuns(runs, "stats.suites");
        results.totalTests = reduceRuns(runs, "stats.tests");
        results.totalPassed = reduceRuns(runs, "stats.passes");
        results.totalPending = reduceRuns(runs, "stats.pending");
        results.totalFailed = reduceRuns(runs, "stats.failures");
        results.totalSkipped = reduceRuns(runs, "stats.skipped");
        results.runs = runs;
        debug("final results of all runs: %o", results);
        return writeOutput(outputPath, results)["return"](results);
      });
    },
    runSpec: function(spec, options, estimated) {
      var browser, browserCanBeRecorded, browserName, cname, isHeaded, isHeadless, name, project, recording, screenshots, video, videosFolder;
      if (spec == null) {
        spec = {};
      }
      if (options == null) {
        options = {};
      }
      project = options.project, browser = options.browser, video = options.video, videosFolder = options.videosFolder;
      isHeadless = browser.isHeadless, isHeaded = browser.isHeaded;
      browserName = browser.name;
      debug("about to run spec %o", {
        spec: spec,
        isHeadless: isHeadless,
        browserName: browserName
      });
      screenshots = [];
      browserCanBeRecorded = function(name) {
        return name === "electron" && isHeadless;
      };
      if (video) {
        if (browserCanBeRecorded(browserName)) {
          if (!videosFolder) {
            throw new Error("Missing videoFolder for recording");
          }
          name = path.join(videosFolder, spec.name + ".mp4");
          cname = path.join(videosFolder, spec.name + "-compressed.mp4");
          recording = this.createRecording(name);
        } else {
          console.log("");
          if (browserName === "electron" && isHeaded) {
            errors.warning("CANNOT_RECORD_VIDEO_HEADED");
          } else {
            errors.warning("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER", browserName);
          }
        }
      }
      return Promise.resolve(recording).then((function(_this) {
        return function(props) {
          var end, start, write;
          if (props == null) {
            props = {};
          }
          start = props.start, end = props.end, write = props.write;
          return Promise.resolve(start).then(function(started) {
            return Promise.props({
              results: _this.waitForTestsToFinishRunning({
                end: end,
                name: name,
                spec: spec,
                cname: cname,
                started: started,
                project: project,
                estimated: estimated,
                screenshots: screenshots,
                exit: options.exit,
                videoCompression: options.videoCompression,
                videoUploadOnPasses: options.videoUploadOnPasses
              }),
              connection: _this.waitForBrowserToConnect({
                spec: spec,
                write: write,
                project: project,
                browser: browser,
                screenshots: screenshots,
                socketId: options.socketId,
                webSecurity: options.webSecurity,
                projectRoot: options.projectRoot
              })
            });
          });
        };
      })(this));
    },
    findSpecs: function(config, specPattern) {
      return specsUtil.find(config, specPattern).tap((function(_this) {
        return function(specs) {
          var names;
          if (specs == null) {
            specs = [];
          }
          if (debug.enabled) {
            names = _.map(specs, "name");
            return debug("found '%d' specs using spec pattern '%s': %o", names.length, specPattern, names);
          }
        };
      })(this));
    },
    ready: function(options) {
      var browserName, ciBuildId, group, key, parallel, projectRoot, record, ref, socketId, specPattern;
      if (options == null) {
        options = {};
      }
      debug("run mode ready with options %o", options);
      _.defaults(options, {
        isTextTerminal: true,
        browser: "electron"
      });
      socketId = random.id();
      projectRoot = options.projectRoot, record = options.record, key = options.key, ciBuildId = options.ciBuildId, parallel = options.parallel, group = options.group;
      browserName = options.browser;
      specPattern = (ref = options.spec) != null ? ref : null;
      recordMode.warnIfCiFlag(options.ci);
      return createAndOpenProject(socketId, options).then((function(_this) {
        return function(arg1) {
          var config, project, projectId;
          project = arg1.project, projectId = arg1.projectId, config = arg1.config;
          recordMode.warnIfProjectIdButNoRecordOption(projectId, options);
          recordMode.throwIfRecordParamsWithoutRecording(record, ciBuildId, parallel, group);
          if (record) {
            recordMode.throwIfNoProjectId(projectId);
            recordMode.throwIfIncorrectCiBuildIdUsage(ciBuildId, parallel, group);
            recordMode.throwIfIndeterminateCiBuildId(ciBuildId, parallel, group);
          }
          return Promise.all([system.info(), browsers.ensureAndGetByName(browserName), _this.findSpecs(config, specPattern), trashAssets(config), removeOldProfiles()]).spread(function(sys, browser, specs) {
            var projectName, runAllSpecs;
            if (sys == null) {
              sys = {};
            }
            if (browser == null) {
              browser = {};
            }
            if (specs == null) {
              specs = [];
            }
            if (specPattern) {
              specPattern = specsUtil.getPatternRelativeToProjectRoot(specPattern, projectRoot);
            }
            if (!specs.length) {
              errors["throw"]('NO_SPECS_FOUND', config.integrationFolder, specPattern);
            }
            runAllSpecs = function(arg2, parallelOverride) {
              var afterSpecRun, beforeSpecRun, runUrl;
              beforeSpecRun = arg2.beforeSpecRun, afterSpecRun = arg2.afterSpecRun, runUrl = arg2.runUrl;
              if (parallelOverride == null) {
                parallelOverride = parallel;
              }
              return _this.runSpecs({
                beforeSpecRun: beforeSpecRun,
                afterSpecRun: afterSpecRun,
                projectRoot: projectRoot,
                specPattern: specPattern,
                socketId: socketId,
                parallel: parallelOverride,
                browser: browser,
                project: project,
                runUrl: runUrl,
                group: group,
                config: config,
                specs: specs,
                sys: sys,
                videosFolder: config.videosFolder,
                video: config.video,
                videoCompression: config.videoCompression,
                videoUploadOnPasses: config.videoUploadOnPasses,
                exit: options.exit,
                headed: options.headed,
                outputPath: options.outputPath
              }).tap(renderSummaryTable(runUrl));
            };
            if (record) {
              projectName = config.projectName;
              return recordMode.createRunAndRecordSpecs({
                key: key,
                sys: sys,
                specs: specs,
                group: group,
                browser: browser,
                parallel: parallel,
                ciBuildId: ciBuildId,
                projectId: projectId,
                projectRoot: projectRoot,
                projectName: projectName,
                specPattern: specPattern,
                runAllSpecs: runAllSpecs
              });
            } else {
              return runAllSpecs({}, false);
            }
          });
        };
      })(this));
    },
    run: function(options) {
      return electronApp.ready().then((function(_this) {
        return function() {
          return _this.ready(options);
        };
      })(this));
    }
  };

}).call(this);
