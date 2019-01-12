(function() {
  var Promise, _, ansi_up, chalk, clone, displayFlags, get, getMsgByType, isCypressErr, listItems, log, pluralize, strip, throwErr, trimMultipleNewLines, twoOrMoreNewLinesRe, warnIfExplicitCiBuildId, warning,
    hasProp = {}.hasOwnProperty;

  _ = require("lodash");

  strip = require("strip-ansi");

  chalk = require("chalk");

  ansi_up = require("ansi_up");

  Promise = require("bluebird");

  pluralize = require("pluralize");

  twoOrMoreNewLinesRe = /\n{2,}/;

  listItems = function(paths) {
    return _.chain(paths).map(function(p) {
      return "- " + chalk.blue(p);
    }).join("\n").value();
  };

  displayFlags = function(obj, mapper) {
    return _.chain(mapper).map(function(flag, key) {
      var v;
      if (v = obj[key]) {
        return "The " + flag + " flag you passed was: " + (chalk.blue(v));
      }
    }).compact().join("\n").value();
  };

  warnIfExplicitCiBuildId = function(ciBuildId) {
    if (!ciBuildId) {
      return "";
    }
    return "It also looks like you also passed in an explicit --ci-build-id flag.\n\nThis is only necessary if you are NOT running in one of our supported CI providers.\n\nThis flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.";
  };

  trimMultipleNewLines = function(str) {
    return _.chain(str).split(twoOrMoreNewLinesRe).compact().join("\n\n").value();
  };

  isCypressErr = function(err) {
    return Boolean(err.isCypressErr);
  };

  getMsgByType = function(type, arg1, arg2) {
    if (arg1 == null) {
      arg1 = {};
    }
    switch (type) {
      case "CANNOT_TRASH_ASSETS":
        return "Warning: We failed to trash the existing run results.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "CANNOT_REMOVE_OLD_BROWSER_PROFILES":
        return "Warning: We failed to remove old browser profiles from previous runs.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "VIDEO_RECORDING_FAILED":
        return "Warning: We failed to record the video.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "VIDEO_POST_PROCESSING_FAILED":
        return "Warning: We failed processing this video.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "BROWSER_NOT_FOUND":
        return "Can't run because you've entered an invalid browser.\n\nBrowser: '" + arg1 + "' was not found on your system.\n\nAvailable browsers found are: " + arg2;
      case "CANNOT_RECORD_VIDEO_HEADED":
        return "Warning: Cypress can only record videos when running headlessly.\n\nYou have set the 'electron' browser to run headed.\n\nA video will not be recorded when using this mode.";
      case "CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER":
        return "Warning: Cypress can only record videos when using the built in 'electron' browser.\n\nYou have set the browser to: '" + arg1 + "'\n\nA video will not be recorded when using this browser.";
      case "NOT_LOGGED_IN":
        return "You're not logged in.\n\nRun `cypress open` to open the Desktop App and log in.";
      case "TESTS_DID_NOT_START_RETRYING":
        return "Timed out waiting for the browser to connect. " + arg1;
      case "TESTS_DID_NOT_START_FAILED":
        return "The browser never connected. Something is wrong. The tests cannot run. Aborting...";
      case "DASHBOARD_API_RESPONSE_FAILED_RETRYING":
        return "We encountered an unexpected error talking to our servers.\n\nWe will retry " + arg1.tries + " more " + (pluralize('time', arg1.tries)) + " in " + arg1.delay + "...\n\nThe server's response was:\n\n" + arg1.response;
      case "DASHBOARD_CANNOT_PROCEED_IN_PARALLEL":
        return "We encountered an unexpected error talking to our servers.\n\nBecause you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.\n\n" + (displayFlags(arg1.flags, {
          group: "--group",
          ciBuildId: "--ciBuildId"
        })) + "\n\nThe server's response was:\n\n" + arg1.response;
      case "DASHBOARD_UNKNOWN_INVALID_REQUEST":
        return "We encountered an unexpected error talking to our servers.\n\nThere is likely something wrong with the request.\n\n" + (displayFlags(arg1.flags, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nThe server's response was:\n\n" + arg1.response;
      case "DASHBOARD_STALE_RUN":
        return "You are attempting to pass the --parallel flag to a run that was completed over 24 hours ago.\n\nThe existing run is: " + arg1.runUrl + "\n\nYou cannot parallelize a run that has been complete for that long.\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nhttps://on.cypress.io/stale-run";
      case "DASHBOARD_ALREADY_COMPLETE":
        return "The run you are attempting to access is already complete and will not accept new groups.\n\nThe existing run is: " + arg1.runUrl + "\n\nWhen a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nhttps://on.cypress.io/already-complete";
      case "DASHBOARD_PARALLEL_REQUIRED":
        return "You did not pass the --parallel flag, but this run's group was originally created with the --parallel flag.\n\nThe existing run is: " + arg1.runUrl + "\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nYou must use the --parallel flag with this group.\n\nhttps://on.cypress.io/parallel-required";
      case "DASHBOARD_PARALLEL_DISALLOWED":
        return "You passed the --parallel flag, but this run group was originally created without the --parallel flag.\n\nThe existing run is: " + arg1.runUrl + "\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nYou can not use the --parallel flag with this group.\n\nhttps://on.cypress.io/parallel-disallowed";
      case "DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH":
        return "You passed the --parallel flag, but we do not parallelize tests across different environments.\n\nThis machine is sending different environment parameters than the first machine that started this parallel run.\n\nThe existing run is: " + arg1.runUrl + "\n\nIn order to run in parallel mode each machine must send identical environment parameters such as:\n\n" + (listItems(["specs", "osName", "osVersion", "browserName", "browserVersion (major)"])) + "\n\nThis machine sent the following parameters:\n\n" + (JSON.stringify(arg1.parameters, null, 2)) + "\n\nhttps://on.cypress.io/parallel-group-params-mismatch";
      case "DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE":
        return "You passed the --group flag, but this group name has already been used for this run.\n\nThe existing run is: " + arg1.runUrl + "\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel",
          ciBuildId: "--ciBuildId"
        })) + "\n\nIf you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.\n\n" + (warnIfExplicitCiBuildId(arg1.ciBuildId)) + "\n\nhttps://on.cypress.io/run-group-name-not-unique";
      case "INDETERMINATE_CI_BUILD_ID":
        return "You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.\n\n" + (displayFlags(arg1, {
          group: "--group",
          parallel: "--parallel"
        })) + "\n\nIn order to use either of these features a ciBuildId must be determined.\n\nThe ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:\n\n" + (listItems(arg2)) + "\n\nBecause the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.\n\nhttps://on.cypress.io/indeterminate-ci-build-id";
      case "RECORD_PARAMS_WITHOUT_RECORDING":
        return "You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.\n\n" + (displayFlags(arg1, {
          ciBuildId: "--ci-build-id",
          group: "--group",
          parallel: "--parallel"
        })) + "\n\nThese flags can only be used when recording to the Cypress Dashboard service.\n\nhttps://on.cypress.io/record-params-without-recording";
      case "INCORRECT_CI_BUILD_ID_USAGE":
        return "You passed the --ci-build-id flag but did not provide either a --group or --parallel flag.\n\n" + (displayFlags(arg1, {
          ciBuildId: "--ci-build-id"
        })) + "\n\nThe --ci-build-id flag is used to either group or parallelize multiple runs together.\n\nhttps://on.cypress.io/incorrect-ci-build-id-usage";
      case "RECORD_KEY_MISSING":
        return "You passed the --record flag but did not provide us your Record Key.\n\nYou can pass us your Record Key like this:\n\n  " + (chalk.blue("cypress run --record --key <record_key>")) + "\n\nYou can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.\n\nhttps://on.cypress.io/how-do-i-record-runs";
      case "CANNOT_RECORD_NO_PROJECT_ID":
        return "You passed the --record flag but this project has not been setup to record.\n\nThis project is missing the 'projectId' inside of 'cypress.json'.\n\nWe cannot uniquely identify this project without this id.\n\nYou need to setup this project to record. This will generate a unique 'projectId'.\n\nAlternatively if you omit the --record flag this project will run without recording.\n\nhttps://on.cypress.io/recording-project-runs";
      case "PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION":
        return "This project has been configured to record runs on our Dashboard.\n\nIt currently has the projectId: " + (chalk.green(arg1)) + "\n\nYou also provided your Record Key, but you did not pass the --record flag.\n\nThis run will not be recorded.\n\nIf you meant to have this run recorded please additionally pass this flag.\n\n  " + (chalk.blue("cypress run --record")) + "\n\nIf you don't want to record these runs, you can silence this warning:\n\n  " + (chalk.yellow("cypress run --record false")) + "\n\nhttps://on.cypress.io/recording-project-runs";
      case "CYPRESS_CI_DEPRECATED":
        return "You are using the deprecated command: " + (chalk.yellow("cypress ci <key>")) + "\n\nPlease switch and use: " + (chalk.blue("cypress run --record --key <record_key>")) + "\n\nhttps://on.cypress.io/cypress-ci-deprecated";
      case "CYPRESS_CI_DEPRECATED_ENV_VAR":
        return "1. You are using the deprecated command: " + (chalk.yellow("cypress ci")) + "\n\n    Please switch and use: " + (chalk.blue("cypress run --record")) + "\n\n2. You are also using the environment variable: " + (chalk.yellow("CYPRESS_CI_KEY")) + "\n\n    Please rename this environment variable to: " + (chalk.blue("CYPRESS_RECORD_KEY")) + "\n\nhttps://on.cypress.io/cypress-ci-deprecated";
      case "DASHBOARD_INVALID_RUN_REQUEST":
        return "Recording this run failed because the request was invalid.\n\n" + arg1.message + "\n\nErrors:\n\n" + (JSON.stringify(arg1.errors, null, 2)) + "\n\nRequest Sent:\n\n" + (JSON.stringify(arg1.object, null, 2));
      case "RECORDING_FROM_FORK_PR":
        return "Warning: It looks like you are trying to record this run from a forked PR.\n\nThe 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.\n\nThese results will not be recorded.\n\nThis error will not alter the exit code.";
      case "DASHBOARD_CANNOT_UPLOAD_RESULTS":
        return "Warning: We encountered an error while uploading results from your run.\n\nThese results will not be recorded.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE":
        return "Warning: We encountered an error talking to our servers.\n\nThis run will not be recorded.\n\nThis error will not alter the exit code.\n\n" + arg1;
      case "DASHBOARD_RECORD_KEY_NOT_VALID":
        return "We failed trying to authenticate this project: " + (chalk.blue(arg2)) + "\n\nYour Record Key is invalid: " + (chalk.yellow(arg1)) + "\n\nIt may have been recently revoked by you or another user.\n\nPlease log into the Dashboard to see the updated token.\n\nhttps://on.cypress.io/dashboard/projects/" + arg2;
      case "DASHBOARD_PROJECT_NOT_FOUND":
        return "We could not find a project with the ID: " + (chalk.yellow(arg1)) + "\n\nThis projectId came from your cypress.json file or an environment variable.\n\nPlease log into the Dashboard and find your project.\n\nWe will list the correct projectId in the 'Settings' tab.\n\nAlternatively, you can create a new project using the Desktop Application.\n\nhttps://on.cypress.io/dashboard";
      case "NO_PROJECT_ID":
        return "Can't find 'projectId' in the 'cypress.json' file for this project: " + chalk.blue(arg1);
      case "NO_PROJECT_FOUND_AT_PROJECT_ROOT":
        return "Can't find project at the path: " + chalk.blue(arg1);
      case "CANNOT_FETCH_PROJECT_TOKEN":
        return "Can't find project's secret key.";
      case "CANNOT_CREATE_PROJECT_TOKEN":
        return "Can't create project's secret key.";
      case "PORT_IN_USE_SHORT":
        return "Port '" + arg1 + "' is already in use.";
      case "PORT_IN_USE_LONG":
        return "Can't run project because port is currently in use: " + (chalk.blue(arg1)) + "\n\n" + (chalk.yellow("Assign a different port with the '--port <port>' argument or shut down the other running process."));
      case "ERROR_READING_FILE":
        return "Error reading from: " + (chalk.blue(arg1)) + "\n\n" + (chalk.yellow(arg2));
      case "ERROR_WRITING_FILE":
        return "Error writing to: " + (chalk.blue(arg1)) + "\n\n" + (chalk.yellow(arg2));
      case "NO_SPECS_FOUND":
        if (!arg2) {
          return "Can't run because no spec files were found.\n\nWe searched for any files inside of this folder:\n\n" + (chalk.blue(arg1));
        } else {
          return "Can't run because no spec files were found.\n\nWe searched for any files matching this glob pattern:\n\n" + (chalk.blue(arg2));
        }
        break;
      case "RENDERER_CRASHED":
        return "We detected that the Chromium Renderer process just crashed.\n\nThis is the equivalent to seeing the 'sad face' when Chrome dies.\n\nThis can happen for a number of different reasons:\n\n- You wrote an endless loop and you must fix your own code\n- There is a memory leak in Cypress (unlikely but possible)\n- You are running Docker (there is an easy fix for this: see link below)\n- You are running lots of tests on a memory intense application\n- You are running in a memory starved VM environment\n- There are problems with your GPU / GPU drivers\n- There are browser bugs in Chromium\n\nYou can learn more including how to fix Docker here:\n\nhttps://on.cypress.io/renderer-process-crashed";
      case "NO_CURRENTLY_OPEN_PROJECT":
        return "Can't find open project.";
      case "AUTOMATION_SERVER_DISCONNECTED":
        return "The automation client disconnected. Cannot continue running tests.";
      case "SUPPORT_FILE_NOT_FOUND":
        return "The support file is missing or invalid.\n\nYour supportFile is set to '" + arg1 + "', but either the file is missing or it's invalid. The supportFile must be a .js or .coffee file or, if you're using a preprocessor plugin, it must be supported by that plugin.\n\nCorrect your cypress.json, create the appropriate file, or set supportFile to false if a support file is not necessary for your project.\n\nLearn more at https://on.cypress.io/support-file-missing-or-invalid";
      case "PLUGINS_FILE_ERROR":
        return ("The plugins file is missing or invalid.\n\nYour pluginsFile is set to '" + arg1 + "', but either the file is missing, it contains a syntax error, or threw an error when required. The pluginsFile must be a .js or .coffee file.\n\nPlease fix this, or set 'pluginsFile' to 'false' if a plugins file is not necessary for your project.\n\n" + (arg2 ? "The following error was thrown:" : "") + "\n\n" + (arg2 ? chalk.yellow(arg2) : "")).trim();
      case "PLUGINS_DIDNT_EXPORT_FUNCTION":
        return "The pluginsFile must export a function.\n\nWe loaded the pluginsFile from: " + arg1 + "\n\nIt exported:\n\n" + (JSON.stringify(arg2));
      case "PLUGINS_FUNCTION_ERROR":
        return ("The function exported by the plugins file threw an error.\n\nWe invoked the function exported by '" + arg1 + "', but it threw an error.\n\nThe following error was thrown:\n\n" + (chalk.yellow(arg2))).trim();
      case "PLUGINS_ERROR":
        return ("The following error was thrown by a plugin. We've stopped running your tests because a plugin crashed.\n\n" + (chalk.yellow(arg1))).trim();
      case "BUNDLE_ERROR":
        return "Oops...we found an error preparing this test file:\n\n  " + (chalk.blue(arg1)) + "\n\nThe error was:\n\n" + (chalk.yellow(arg2)) + "\n\nThis occurred while Cypress was compiling and bundling your test code. This is usually caused by:\n\n- A missing file or dependency\n- A syntax error in the file or one of its dependencies\n\nFix the error in your code and re-run your tests.";
      case "SETTINGS_VALIDATION_ERROR":
        return "We found an invalid value in the file: '" + (chalk.blue(arg1)) + "'\n\n" + (chalk.yellow(arg2));
      case "CONFIG_VALIDATION_ERROR":
        return "We found an invalid configuration value:\n\n" + (chalk.yellow(arg1));
      case "SCREENSHOT_ON_HEADLESS_FAILURE_REMOVED":
        return "In Cypress v3.0.0 we removed the configuration option: " + (chalk.yellow('screenshotOnHeadlessFailure')) + "\n\nYou now configure this behavior in your test code.\n\nExample:\n\n  // cypress/support/index.js\n  Cypress.Screenshot.defaults({\n    screenshotOnRunFailure: false\n  })\n\nhttps://on.cypress.io/screenshot-api";
      case "RENAMED_CONFIG_OPTION":
        return "A configuration option you have supplied has been renamed.\n\nPlease rename " + (chalk.yellow(arg1)) + " to " + (chalk.blue(arg2));
      case "CANNOT_CONNECT_BASE_URL":
        return "Cypress could not verify that the server set as your 'baseUrl' is running:\n\n  > " + (chalk.blue(arg1)) + "\n\nYour tests likely make requests to this 'baseUrl' and these tests will fail if you don't boot your server.\n\nPlease start this server and then run Cypress again.";
      case "CANNOT_CONNECT_BASE_URL_WARNING":
        return "Cypress could not verify that the server set as your 'baseUrl' is running: " + arg1 + "\n\nYour tests likely make requests to this 'baseUrl' and these tests will fail if you don't boot your server.";
      case "INVALID_REPORTER_NAME":
        return "Could not load reporter by name: " + (chalk.yellow(arg1.name)) + "\n\nWe searched for the reporter in these paths:\n\n" + (listItems(arg1.paths)) + "\n\nThe error we received was:\n\n" + (chalk.yellow(arg1.error)) + "\n\nLearn more at https://on.cypress.io/reporters";
      case "PROJECT_DOES_NOT_EXIST":
        return "Could not find any tests to run.\n\nWe looked but did not find a " + (chalk.blue('cypress.json')) + " file in this folder: " + (chalk.blue(arg1));
      case "DUPLICATE_TASK_KEY":
        return "Warning: Multiple attempts to register the following task(s): " + (chalk.blue(arg1)) + ". Only the last attempt will be registered.";
      case "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
        return "You've exceeded the limit of private test recordings under your free plan this month. " + arg1.usedMessage + "\n\nTo continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.\n\n" + arg1.link;
      case "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS":
        return "You've exceeded the limit of private test recordings under your free plan this month. " + arg1.usedMessage + "\n\nYour plan is now in a grace period, which means your tests will still be recorded until " + arg1.gracePeriodMessage + ". Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.\n\n" + arg1.link;
      case "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
        return "You've exceeded the limit of private test recordings under your current billing plan this month. " + arg1.usedMessage + "\n\nTo upgrade your account, please visit your billing to upgrade to another billing plan.\n\n" + arg1.link;
      case "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE":
        return "Parallelization is not included under your free plan.\n\nYour plan is now in a grace period, which means your tests will still run in parallel until " + arg1.gracePeriodMessage + ". Please upgrade your plan to continue running your tests in parallel in the future.\n\n" + arg1.link;
      case "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN":
        return "Parallelization is not included under your current billing plan.\n\nTo run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.\n\n" + arg1.link;
      case "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED":
        return "Grouping is not included under your free plan.\n\nYour plan is now in a grace period, which means your tests will still run with groups until " + arg1.gracePeriodMessage + ". Please upgrade your plan to continue running your tests with groups in the future.\n\n" + arg1.link;
      case "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN":
        return "Grouping is not included under your current billing plan.\n\nTo run your tests with groups, please visit your billing and upgrade to another plan with grouping.\n\n" + arg1.link;
    }
  };

  get = function(type, arg1, arg2) {
    var err, msg;
    msg = getMsgByType(type, arg1, arg2);
    msg = trimMultipleNewLines(msg);
    err = new Error(msg);
    err.isCypressErr = true;
    err.type = type;
    return err;
  };

  warning = function(type, arg1, arg2) {
    var err;
    err = get(type, arg1, arg2);
    return log(err, "magenta");
  };

  throwErr = function(type, arg1, arg2) {
    throw get(type, arg1, arg2);
  };

  clone = function(err, options) {
    var obj, prop, val;
    if (options == null) {
      options = {};
    }
    _.defaults(options, {
      html: false
    });
    obj = _.pick(err, "type", "name", "stack", "fileName", "lineNumber", "columnNumber");
    if (options.html) {
      obj.message = ansi_up.ansi_to_html(err.message, {
        use_classes: true
      });
    } else {
      obj.message = err.message;
    }
    for (prop in err) {
      if (!hasProp.call(err, prop)) continue;
      val = err[prop];
      obj[prop] = val;
    }
    return obj;
  };

  log = function(err, color) {
    if (color == null) {
      color = "red";
    }
    return Promise["try"](function() {
      console.log(chalk[color](err.message));
      if (isCypressErr(err)) {
        return;
      }
      console.log(chalk[color](err.stack));
      if (process.env["CYPRESS_ENV"] === "production") {
        return require("./logger").createException(err)["catch"](function() {});
      }
    });
  };

  module.exports = {
    get: get,
    log: log,
    clone: clone,
    warning: warning,
    getMsgByType: getMsgByType,
    isCypressErr: isCypressErr,
    "throw": throwErr,
    stripAnsi: strip
  };

}).call(this);
