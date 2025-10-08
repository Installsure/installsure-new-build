interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = LOG_LEVELS.INFO;

class Logger {
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] ${level}: ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage("DEBUG", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(this.formatMessage("INFO", message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  error(message: string, data?: any): void {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage("ERROR", message, data));
    }
  }
}

export const logger = new Logger();
