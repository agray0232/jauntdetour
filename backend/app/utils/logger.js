/**
 * Minimal leveled logger for the backend.
 *
 * Wraps the console with timestamped, level-prefixed output so application code
 * has a single place to send logs (and a single place to later swap in a real
 * logging library such as winston or pino). Levels: info, warn, error.
 */

/**
 * Format a log line with an ISO timestamp and uppercase level prefix.
 *
 * @param {string} level - Log level label.
 * @param {string} message - Human-readable message.
 * @returns {string} The formatted prefix + message.
 */
function format(level, message) {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
}

module.exports = {
  info: function (message, ...meta) {
    console.log(format("info", message), ...meta);
  },
  warn: function (message, ...meta) {
    console.warn(format("warn", message), ...meta);
  },
  error: function (message, ...meta) {
    console.error(format("error", message), ...meta);
  },
};
