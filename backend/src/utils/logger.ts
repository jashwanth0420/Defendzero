type LogLevel = 'info' | 'warn' | 'error';

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const base = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  if (!context || Object.keys(context).length === 0) {
    return base;
  }

  return `${base} ${JSON.stringify(context)}`;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    console.info(formatMessage('info', message, context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, context?: Record<string, unknown>): void {
    console.error(formatMessage('error', message, context));
  }
};
