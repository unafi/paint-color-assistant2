/**
 * アプリケーション用ロガー
 * 環境変数に基づいてログレベルを制御
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  debug: boolean;
  logLevel: LogLevel;
  appName: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      debug: import.meta.env.VITE_DEBUG === 'true',
      logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      appName: import.meta.env.VITE_APP_NAME || 'App'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.debug && level === 'debug') {
      return false;
    }

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.config.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.config.appName}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * 情報ログ
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * 警告ログ
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * エラーログ
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  /**
   * 設定情報の取得
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// 便利な関数エクスポート
export const debugLog = logger.debug.bind(logger);
export const infoLog = logger.info.bind(logger);
export const warnLog = logger.warn.bind(logger);
export const errorLog = logger.error.bind(logger);