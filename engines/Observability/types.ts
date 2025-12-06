
export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export enum LogType {
    API_REQUEST = 'API_REQUEST',
    SYSTEM = 'SYSTEM',
    AUTH = 'AUTH',
    DB = 'DB',
}

export interface LogEntry {
    level: LogLevel;
    type: LogType;
    message: string;
    metadata?: any;
    timestamp: Date;
    endpoint?: string;
    method?: string;
    userId?: string;
    _id?: any;
}

export interface SystemStats {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    lastUpdated: Date;
}
