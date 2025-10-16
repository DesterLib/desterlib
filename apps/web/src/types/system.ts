/**
 * System monitoring and admin API response types
 * These types represent the actual API responses which may differ from generated types
 */

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export interface ReadinessCheckResponse {
  status: string;
  timestamp: string;
  checks: {
    database: boolean;
  };
}

export interface LivenessCheckResponse {
  status: string;
  timestamp: string;
  pid: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export interface AdminHealthCheckResponse {
  status: string;
  database?: boolean;
  cache?: boolean;
  disk?: {
    available: number;
    total: number;
  };
}

export interface PerformanceMetricsResponse {
  requests?: {
    total: number;
    avgResponseTime: number;
    slowest?: {
      endpoint: string;
      duration: number;
    };
  };
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu?: {
    usage: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
  timestamp: string;
}

export interface ActiveAlertsResponse {
  count: number;
  alerts: Alert[];
}

export interface AlertHistoryResponse {
  count: number;
  alerts: Alert[];
}

export interface Backup {
  filename: string;
  size: number;
  created: string;
  type: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup?: string;
  newestBackup?: string;
}

export interface BackupsResponse {
  backups: Backup[];
  stats: BackupStats;
}

export interface CreateBackupResponse {
  message: string;
  backup: Backup;
}

export interface RestoreBackupResponse {
  message: string;
  restoredFrom: string;
}

export interface DeleteBackupResponse {
  message: string;
}

export interface UpdateMetricsResponse {
  message: string;
}

export interface ResetPerformanceResponse {
  message: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiDataResponse<T> {
  data: T;
  status: number;
  headers?: Headers;
}
