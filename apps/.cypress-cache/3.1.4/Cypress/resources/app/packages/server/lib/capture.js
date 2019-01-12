(function() {
  var _log, _write, restore, stdout;

  _write = process.stdout.write;

  _log = process.log;

  restore = function() {
    process.stdout.write = _write;
    return process.log = _log;
  };

  stdout = function() {
    var log, logs, write;
    logs = [];
    write = process.stdout.write;
    log = process.log;
    if (log) {
      process.log = function(str) {
        logs.push(str);
        return log.apply(this, arguments);
      };
    }
    process.stdout.write = function(str) {
      logs.push(str);
      return write.apply(this, arguments);
    };
    return {
      toString: function() {
        return logs.join("");
      },
      data: logs,
      restore: restore
    };
  };

  module.exports = {
    stdout: stdout,
    restore: restore
  };

}).call(this);
