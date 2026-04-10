// config/logger.js
// Simple structured logger for cloud deployment

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

function formatMessage(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    service: 'solvemate',
    environment: process.env.NODE_ENV || 'development'
  });
}

const logger = {
  error: (message, ...args) => {
    if (LOG_LEVELS.error <= LOG_LEVELS[currentLevel]) {
      console.error(formatMessage('error', message, args.length ? { details: args } : {}));
    }
  },
  warn: (message, ...args) => {
    if (LOG_LEVELS.warn <= LOG_LEVELS[currentLevel]) {
      console.warn(formatMessage('warn', message, args.length ? { details: args } : {}));
    }
  },
  info: (message, ...args) => {
    if (LOG_LEVELS.info <= LOG_LEVELS[currentLevel]) {
      console.log(formatMessage('info', message, args.length ? { details: args } : {}));
    }
  },
  debug: (message, ...args) => {
    if (LOG_LEVELS.debug <= LOG_LEVELS[currentLevel]) {
      console.log(formatMessage('debug', message, args.length ? { details: args } : {}));
    }
  }
};

module.exports = logger;
