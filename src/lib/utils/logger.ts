/**
 * Logger utility for consistent logging across the application.
 * Logs are only output in development mode, except for errors which are always logged.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (dev only)
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  /**
   * Log warnings (dev only)
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },

  /**
   * Log debug information (dev only)
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
};
