(function() {
  var Promise, _, api, billingLink, capture, chalk, check, ciProvider, commitInfo, createInstance, createRun, createRunAndRecordSpecs, debug, env, errors, getCommitFromGitOrCi, getSpecRelativePath, gracePeriodMessage, haveProjectIdAndKeyButNoRecordOption, humanTime, isForkPr, la, logException, logger, onBeforeRetry, os, runningInternalTests, terminal, throwIfIncorrectCiBuildIdUsage, throwIfIndeterminateCiBuildId, throwIfNoProjectId, throwIfRecordParamsWithoutRecording, updateInstance, updateInstanceStdout, upload, uploadArtifacts, usedMessage, warnIfCiFlag, warnIfProjectIdButNoRecordOption;

  _ = require("lodash");

  os = require("os");

  la = require("lazy-ass");

  chalk = require("chalk");

  check = require("check-more-types");

  debug = require("debug")("cypress:server:record");

  Promise = require("bluebird");

  isForkPr = require("is-fork-pr");

  commitInfo = require("@cypress/commit-info");

  api = require("../api");

  logger = require("../logger");

  errors = require("../errors");

  capture = require("../capture");

  upload = require("../upload");

  env = require("../util/env");

  terminal = require("../util/terminal");

  humanTime = require("../util/human_time");

  ciProvider = require("../util/ci_provider");

  onBeforeRetry = function(details) {
    return errors.warning("DASHBOARD_API_RESPONSE_FAILED_RETRYING", {
      delay: humanTime.long(details.delay, false),
      tries: details.total - details.retryIndex,
      response: details.err
    });
  };

  logException = function(err) {
    return logger.createException(err).timeout(1000)["catch"](function() {});
  };

  runningInternalTests = function() {
    return env.get("CYPRESS_INTERNAL_E2E_TESTS") === "1";
  };

  warnIfCiFlag = function(ci) {
    var type;
    if (ci) {
      type = (function() {
        switch (false) {
          case !env.get("CYPRESS_CI_KEY"):
            return "CYPRESS_CI_DEPRECATED_ENV_VAR";
          default:
            return "CYPRESS_CI_DEPRECATED";
        }
      })();
      return errors.warning(type);
    }
  };

  haveProjectIdAndKeyButNoRecordOption = function(projectId, options) {
    return (projectId && options.key) && (_.isUndefined(options.record) && _.isUndefined(options.ci));
  };

  warnIfProjectIdButNoRecordOption = function(projectId, options) {
    if (haveProjectIdAndKeyButNoRecordOption(projectId, options)) {
      return errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId);
    }
  };

  throwIfIndeterminateCiBuildId = function(ciBuildId, parallel, group) {
    if ((!ciBuildId && !ciProvider.provider()) && (parallel || group)) {
      return errors["throw"]("INDETERMINATE_CI_BUILD_ID", {
        group: group,
        parallel: parallel
      }, ciProvider.detectableCiBuildIdProviders());
    }
  };

  throwIfRecordParamsWithoutRecording = function(record, ciBuildId, parallel, group) {
    if (!record && _.some([ciBuildId, parallel, group])) {
      return errors["throw"]("RECORD_PARAMS_WITHOUT_RECORDING", {
        ciBuildId: ciBuildId,
        group: group,
        parallel: parallel
      });
    }
  };

  throwIfIncorrectCiBuildIdUsage = function(ciBuildId, parallel, group) {
    if (ciBuildId && (!parallel && !group)) {
      return errors["throw"]("INCORRECT_CI_BUILD_ID_USAGE", {
        ciBuildId: ciBuildId
      });
    }
  };

  throwIfNoProjectId = function(projectId) {
    if (!projectId) {
      return errors["throw"]("CANNOT_RECORD_NO_PROJECT_ID");
    }
  };

  getSpecRelativePath = function(spec) {
    return _.get(spec, "relative", null);
  };

  uploadArtifacts = function(options) {
    var count, nums, screenshotUploadUrls, screenshots, send, shouldUploadVideo, uploads, video, videoUploadUrl;
    if (options == null) {
      options = {};
    }
    video = options.video, screenshots = options.screenshots, videoUploadUrl = options.videoUploadUrl, shouldUploadVideo = options.shouldUploadVideo, screenshotUploadUrls = options.screenshotUploadUrls;
    uploads = [];
    count = 0;
    nums = function() {
      count += 1;
      return chalk.gray("(" + count + "/" + uploads.length + ")");
    };
    send = function(pathToFile, url) {
      var fail, success;
      success = function() {
        return console.log("  - Done Uploading " + (nums()), chalk.blue(pathToFile));
      };
      fail = function(err) {
        debug("failed to upload artifact %o", {
          file: pathToFile,
          stack: err.stack
        });
        return console.log("  - Failed Uploading " + (nums()), chalk.red(pathToFile));
      };
      return uploads.push(upload.send(pathToFile, url).then(success)["catch"](fail));
    };
    if (videoUploadUrl && shouldUploadVideo) {
      send(video, videoUploadUrl);
    }
    if (screenshotUploadUrls) {
      screenshotUploadUrls.forEach(function(obj) {
        var screenshot;
        screenshot = _.find(screenshots, {
          screenshotId: obj.screenshotId
        });
        return send(screenshot.path, obj.uploadUrl);
      });
    }
    if (!uploads.length) {
      console.log("  - Nothing to Upload");
    }
    return Promise.all(uploads)["catch"](function(err) {
      errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err);
      return logException(err);
    });
  };

  updateInstanceStdout = function(options) {
    var captured, instanceId, makeRequest, stdout;
    if (options == null) {
      options = {};
    }
    instanceId = options.instanceId, captured = options.captured;
    stdout = captured.toString();
    makeRequest = function() {
      return api.updateInstanceStdout({
        stdout: stdout,
        instanceId: instanceId
      });
    };
    return api.retryWithBackoff(makeRequest, {
      onBeforeRetry: onBeforeRetry
    })["catch"](function(err) {
      debug("failed updating instance stdout %o", {
        stack: err.stack
      });
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err);
      }
    })["finally"](capture.restore);
  };

  updateInstance = function(options) {
    var captured, ciBuildId, cypressConfig, error, group, hooks, instanceId, makeRequest, parallel, reporterStats, results, screenshots, stats, stdout, tests, video;
    if (options == null) {
      options = {};
    }
    instanceId = options.instanceId, results = options.results, captured = options.captured, group = options.group, parallel = options.parallel, ciBuildId = options.ciBuildId;
    stats = results.stats, tests = results.tests, hooks = results.hooks, video = results.video, screenshots = results.screenshots, reporterStats = results.reporterStats, error = results.error;
    video = Boolean(video);
    cypressConfig = options.config;
    stdout = captured.toString();
    screenshots = _.map(screenshots, function(screenshot) {
      return _.omit(screenshot, "path");
    });
    makeRequest = function() {
      return api.updateInstance({
        stats: stats,
        tests: tests,
        error: error,
        video: video,
        hooks: hooks,
        stdout: stdout,
        instanceId: instanceId,
        screenshots: screenshots,
        reporterStats: reporterStats,
        cypressConfig: cypressConfig
      });
    };
    return api.retryWithBackoff(makeRequest, {
      onBeforeRetry: onBeforeRetry
    })["catch"](function(err) {
      debug("failed updating instance %o", {
        stack: err.stack
      });
      if (parallel) {
        return errors["throw"]("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
          response: err,
          flags: {
            group: group,
            ciBuildId: ciBuildId
          }
        });
      }
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err)["return"](null);
      } else {
        return null;
      }
    });
  };

  getCommitFromGitOrCi = function(git) {
    la(check.object(git), 'expected git information object', git);
    return ciProvider.commitDefaults({
      sha: git.sha,
      branch: git.branch,
      authorName: git.author,
      authorEmail: git.email,
      message: git.message,
      remoteOrigin: git.remote,
      defaultBranch: null
    });
  };

  usedMessage = function(limit) {
    if (_.isFinite(limit)) {
      return "The limit is " + (chalk.blue(limit)) + " private test recordings.";
    } else {
      return "";
    }
  };

  billingLink = function(orgId) {
    if (orgId) {
      return "https://on.cypress.io/dashboard/organizations/" + orgId + "/billing";
    } else {
      return "https://on.cypress.io/set-up-billing";
    }
  };

  gracePeriodMessage = function(gracePeriodEnds) {
    return gracePeriodEnds || "the grace period ends";
  };

  createRun = function(options) {
    var ciBuildId, commit, git, group, makeRequest, parallel, platform, projectId, recordKey, specPattern, specs;
    if (options == null) {
      options = {};
    }
    _.defaults(options, {
      group: null,
      parallel: null,
      ciBuildId: null
    });
    projectId = options.projectId, recordKey = options.recordKey, platform = options.platform, git = options.git, specPattern = options.specPattern, specs = options.specs, parallel = options.parallel, ciBuildId = options.ciBuildId, group = options.group;
    if (recordKey == null) {
      recordKey = env.get("CYPRESS_RECORD_KEY") || env.get("CYPRESS_CI_KEY");
    }
    if (!recordKey) {
      if (isForkPr.isForkPr() && !runningInternalTests()) {
        return errors.warning("RECORDING_FROM_FORK_PR");
      }
      errors["throw"]("RECORD_KEY_MISSING");
    }
    if (specPattern) {
      specPattern = specPattern.join(",");
    }
    if (ciBuildId) {
      ciBuildId = String(ciBuildId);
    }
    specs = _.map(specs, getSpecRelativePath);
    commit = getCommitFromGitOrCi(git);
    debug("commit information from Git or from environment variables");
    debug(commit);
    makeRequest = function() {
      return api.createRun({
        specs: specs,
        group: group,
        parallel: parallel,
        platform: platform,
        ciBuildId: ciBuildId,
        projectId: projectId,
        recordKey: recordKey,
        specPattern: specPattern,
        ci: {
          params: ciProvider.ciParams(),
          provider: ciProvider.provider()
        },
        commit: commit
      });
    };
    return api.retryWithBackoff(makeRequest, {
      onBeforeRetry: onBeforeRetry
    }).tap(function(response) {
      var ref;
      if (!(response != null ? (ref = response.warnings) != null ? ref.length : void 0 : void 0)) {
        return;
      }
      return _.each(response.warnings, function(warning) {
        switch (warning.code) {
          case "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS":
            return errors.warning("FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
              usedMessage: usedMessage(warning.limit),
              gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
              link: billingLink(warning.orgId)
            });
          case "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE":
            return errors.warning("FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE", {
              gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
              link: billingLink(warning.orgId)
            });
          case "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
            return errors.warning("PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
              usedMessage: usedMessage(warning.limit),
              link: billingLink(warning.orgId)
            });
          case "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED":
            return errors.warning("PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED", {
              gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
              link: billingLink(warning.orgId)
            });
        }
      });
    })["catch"](function(err) {
      var browserName, browserVersion, code, limit, orgId, osName, osVersion, payload, ref, ref1, runUrl;
      debug("failed creating run %o", {
        stack: err.stack
      });
      switch (err.statusCode) {
        case 401:
          recordKey = recordKey.slice(0, 5) + "..." + recordKey.slice(-5);
          return errors["throw"]("DASHBOARD_RECORD_KEY_NOT_VALID", recordKey, projectId);
        case 402:
          ref = err.error, code = ref.code, payload = ref.payload;
          limit = _.get(payload, "limit");
          orgId = _.get(payload, "orgId");
          switch (code) {
            case "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
              return errors["throw"]("FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
                usedMessage: usedMessage(limit),
                link: billingLink(orgId)
              });
            case "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN":
              return errors["throw"]("PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN", {
                link: billingLink(orgId)
              });
            case "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN":
              return errors["throw"]("RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN", {
                link: billingLink(orgId)
              });
            default:
              return errors["throw"]("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
                response: err,
                flags: {
                  group: group,
                  parallel: parallel,
                  ciBuildId: ciBuildId
                }
              });
          }
          break;
        case 404:
          return errors["throw"]("DASHBOARD_PROJECT_NOT_FOUND", projectId);
        case 412:
          return errors["throw"]("DASHBOARD_INVALID_RUN_REQUEST", err.error);
        case 422:
          ref1 = err.error, code = ref1.code, payload = ref1.payload;
          runUrl = _.get(payload, "runUrl");
          switch (code) {
            case "RUN_GROUP_NAME_NOT_UNIQUE":
              return errors["throw"]("DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE", {
                group: group,
                runUrl: runUrl,
                ciBuildId: ciBuildId
              });
            case "PARALLEL_GROUP_PARAMS_MISMATCH":
              browserName = platform.browserName, browserVersion = platform.browserVersion, osName = platform.osName, osVersion = platform.osVersion;
              return errors["throw"]("DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH", {
                group: group,
                runUrl: runUrl,
                ciBuildId: ciBuildId,
                parameters: {
                  osName: osName,
                  osVersion: osVersion,
                  browserName: browserName,
                  browserVersion: browserVersion,
                  specs: specs
                }
              });
            case "PARALLEL_DISALLOWED":
              return errors["throw"]("DASHBOARD_PARALLEL_DISALLOWED", {
                group: group,
                runUrl: runUrl,
                ciBuildId: ciBuildId
              });
            case "PARALLEL_REQUIRED":
              return errors["throw"]("DASHBOARD_PARALLEL_REQUIRED", {
                group: group,
                runUrl: runUrl,
                ciBuildId: ciBuildId
              });
            case "ALREADY_COMPLETE":
              return errors["throw"]("DASHBOARD_ALREADY_COMPLETE", {
                runUrl: runUrl,
                group: group,
                parallel: parallel,
                ciBuildId: ciBuildId
              });
            case "STALE_RUN":
              return errors["throw"]("DASHBOARD_STALE_RUN", {
                runUrl: runUrl,
                group: group,
                parallel: parallel,
                ciBuildId: ciBuildId
              });
            default:
              return errors["throw"]("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
                response: err,
                flags: {
                  group: group,
                  parallel: parallel,
                  ciBuildId: ciBuildId
                }
              });
          }
          break;
        default:
          if (parallel) {
            return errors["throw"]("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
              response: err,
              flags: {
                group: group,
                ciBuildId: ciBuildId
              }
            });
          }
          errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
          return logException(err)["return"](null);
      }
    });
  };

  createInstance = function(options) {
    var ciBuildId, group, groupId, machineId, makeRequest, parallel, platform, runId, spec;
    if (options == null) {
      options = {};
    }
    runId = options.runId, group = options.group, groupId = options.groupId, parallel = options.parallel, machineId = options.machineId, ciBuildId = options.ciBuildId, platform = options.platform, spec = options.spec;
    spec = getSpecRelativePath(spec);
    makeRequest = function() {
      return api.createInstance({
        spec: spec,
        runId: runId,
        groupId: groupId,
        platform: platform,
        machineId: machineId
      });
    };
    return api.retryWithBackoff(makeRequest, {
      onBeforeRetry: onBeforeRetry
    })["catch"](function(err) {
      debug("failed creating instance %o", {
        stack: err.stack
      });
      if (parallel) {
        return errors["throw"]("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
          response: err,
          flags: {
            group: group,
            ciBuildId: ciBuildId
          }
        });
      }
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err)["return"](null);
      } else {
        return null;
      }
    });
  };

  createRunAndRecordSpecs = function(options) {
    var browser, ciBuildId, group, parallel, projectId, projectRoot, recordKey, runAllSpecs, specPattern, specs, sys;
    if (options == null) {
      options = {};
    }
    specPattern = options.specPattern, specs = options.specs, sys = options.sys, browser = options.browser, projectId = options.projectId, projectRoot = options.projectRoot, runAllSpecs = options.runAllSpecs, parallel = options.parallel, ciBuildId = options.ciBuildId, group = options.group;
    recordKey = options.key;
    return commitInfo.commitInfo(projectRoot).then(function(git) {
      var platform;
      debug("found the following git information");
      debug(git);
      platform = {
        osCpus: sys.osCpus,
        osName: sys.osName,
        osMemory: sys.osMemory,
        osVersion: sys.osVersion,
        browserName: browser.displayName,
        browserVersion: browser.version
      };
      return createRun({
        git: git,
        specs: specs,
        group: group,
        parallel: parallel,
        platform: platform,
        recordKey: recordKey,
        ciBuildId: ciBuildId,
        projectId: projectId,
        specPattern: specPattern
      }).then(function(resp) {
        var afterSpecRun, beforeSpecRun, captured, groupId, instanceId, machineId, runId, runUrl;
        if (!resp) {
          return runAllSpecs({}, false);
        } else {
          runUrl = resp.runUrl, runId = resp.runId, machineId = resp.machineId, groupId = resp.groupId;
          captured = null;
          instanceId = null;
          beforeSpecRun = function(spec) {
            debug("before spec run %o", {
              spec: spec
            });
            capture.restore();
            captured = capture.stdout();
            return createInstance({
              spec: spec,
              runId: runId,
              group: group,
              groupId: groupId,
              platform: platform,
              parallel: parallel,
              ciBuildId: ciBuildId,
              machineId: machineId
            }).then(function(resp) {
              if (resp == null) {
                resp = {};
              }
              instanceId = resp.instanceId;
              return _.chain(resp).pick("spec", "claimedInstances", "totalInstances").extend({
                estimated: resp.estimatedWallClockDuration
              }).value();
            });
          };
          afterSpecRun = function(spec, results, config) {
            if (!instanceId) {
              return;
            }
            debug("after spec run %o", {
              spec: spec
            });
            console.log("");
            terminal.header("Uploading Results", {
              color: ["blue"]
            });
            console.log("");
            return updateInstance({
              group: group,
              config: config,
              results: results,
              captured: captured,
              parallel: parallel,
              ciBuildId: ciBuildId,
              instanceId: instanceId
            }).then(function(resp) {
              var screenshotUploadUrls, screenshots, shouldUploadVideo, video, videoUploadUrl;
              if (!resp) {
                return;
              }
              video = results.video, shouldUploadVideo = results.shouldUploadVideo, screenshots = results.screenshots;
              videoUploadUrl = resp.videoUploadUrl, screenshotUploadUrls = resp.screenshotUploadUrls;
              return uploadArtifacts({
                video: video,
                screenshots: screenshots,
                videoUploadUrl: videoUploadUrl,
                shouldUploadVideo: shouldUploadVideo,
                screenshotUploadUrls: screenshotUploadUrls
              })["finally"](function() {
                return updateInstanceStdout({
                  captured: captured,
                  instanceId: instanceId
                });
              });
            });
          };
          return runAllSpecs({
            beforeSpecRun: beforeSpecRun,
            afterSpecRun: afterSpecRun,
            runUrl: runUrl
          });
        }
      });
    });
  };

  module.exports = {
    createRun: createRun,
    createInstance: createInstance,
    updateInstance: updateInstance,
    updateInstanceStdout: updateInstanceStdout,
    uploadArtifacts: uploadArtifacts,
    warnIfCiFlag: warnIfCiFlag,
    throwIfNoProjectId: throwIfNoProjectId,
    throwIfIndeterminateCiBuildId: throwIfIndeterminateCiBuildId,
    throwIfIncorrectCiBuildIdUsage: throwIfIncorrectCiBuildIdUsage,
    warnIfProjectIdButNoRecordOption: warnIfProjectIdButNoRecordOption,
    throwIfRecordParamsWithoutRecording: throwIfRecordParamsWithoutRecording,
    createRunAndRecordSpecs: createRunAndRecordSpecs,
    getCommitFromGitOrCi: getCommitFromGitOrCi
  };

}).call(this);
