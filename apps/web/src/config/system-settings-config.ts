import type { SettingsPageConfig } from "@/config/settings-config";
import type {
  AdminHealthCheckResponse,
  PerformanceMetricsResponse,
  ActiveAlertsResponse,
  BackupsResponse,
} from "@/types/system";
import { Download, RefreshCw, Trash2, Database } from "lucide-react";

interface SystemSettingsConfigParams {
  healthData?: AdminHealthCheckResponse | null;
  performanceData?: PerformanceMetricsResponse | null;
  alertData?: ActiveAlertsResponse | null;
  backupData?: BackupsResponse | null;
  onRefreshHealth: () => void;
  onResetPerformanceMetrics: () => void;
  onCreateBackup: () => void;
  onRestoreBackup: (filename: string) => void;
  onDeleteBackup: (filename: string) => void;
  onUpdateMetrics: () => void;
}

/**
 * Generate system settings configuration based on actual data
 */
export function systemSettingsConfig({
  healthData,
  performanceData,
  alertData,
  backupData,
  onRefreshHealth,
  onResetPerformanceMetrics,
  onCreateBackup,
  onDeleteBackup,
  onUpdateMetrics,
}: SystemSettingsConfigParams): SettingsPageConfig {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return {
    title: "System & Monitoring",
    description: "Monitor system health, performance, and manage backups",
    groups: [
      // Health Status
      {
        id: "health-status",
        title: "System Health",
        description: "Real-time system health monitoring",
        headerAction: {
          label: "Refresh",
          icon: RefreshCw,
          variant: "modification",
          onClick: onRefreshHealth,
        },
        items: [
          {
            id: "overall-health",
            label: "Overall Status",
            description: "Current system health status",
            icon: "💚",
            iconBgColor:
              healthData?.status === "healthy"
                ? "bg-green-500/20"
                : "bg-red-500/20",
            status: healthData?.status?.toUpperCase() || "UNKNOWN",
            statusColor:
              healthData?.status === "healthy" ? "bg-green-400" : "bg-red-400",
          },
          {
            id: "database-health",
            label: "Database Connection",
            description: "PostgreSQL database connection status",
            icon: "🗄️",
            iconBgColor: healthData?.database
              ? "bg-green-500/20"
              : "bg-red-500/20",
            status: healthData?.database ? "Connected" : "Disconnected",
            statusColor: healthData?.database ? "bg-green-400" : "bg-red-400",
          },
          {
            id: "cache-health",
            label: "Cache Status",
            description: "Application cache status",
            icon: "⚡",
            iconBgColor: healthData?.cache
              ? "bg-green-500/20"
              : "bg-yellow-500/20",
            status: healthData?.cache ? "Active" : "Inactive",
            statusColor: healthData?.cache ? "bg-green-400" : "bg-yellow-400",
          },
          ...(healthData?.disk
            ? [
                {
                  id: "disk-space",
                  label: "Disk Space",
                  description: `${formatBytes(healthData.disk.available)} available of ${formatBytes(healthData.disk.total)}`,
                  icon: "💾",
                  iconBgColor: "bg-blue-500/20",
                  status: `${Math.round((healthData.disk.available / healthData.disk.total) * 100)}% Free`,
                  statusColor: "bg-blue-400",
                },
              ]
            : []),
        ],
      },

      // Performance Metrics
      {
        id: "performance",
        title: "Performance Metrics",
        description: "System performance statistics",
        headerAction: {
          label: "Reset Stats",
          icon: RefreshCw,
          variant: "danger",
          onClick: onResetPerformanceMetrics,
        },
        items: [
          ...(performanceData?.requests
            ? [
                {
                  id: "request-count",
                  label: "API Requests",
                  description:
                    "Total number of requests processed since last restart",
                  icon: "📊",
                  iconBgColor: "bg-blue-500/20",
                  value: performanceData.requests.total.toLocaleString(),
                  type: "display" as const,
                },
                {
                  id: "avg-response-time",
                  label: "Response Time (Avg)",
                  description: "Average time to process API requests",
                  icon: "⏱️",
                  iconBgColor: "bg-purple-500/20",
                  value: `${performanceData.requests.avgResponseTime.toFixed(0)} ms`,
                  type: "display" as const,
                },
              ]
            : []),
          ...(performanceData?.memory
            ? [
                {
                  id: "memory-usage",
                  label: "Memory Usage",
                  description: `JS Heap: ${performanceData.memory.heapUsed} MB / ${performanceData.memory.heapTotal} MB • Total includes heap + code + native memory`,
                  icon: "🧠",
                  iconBgColor: "bg-orange-500/20",
                  value: `${performanceData.memory.rss} MB Total`,
                  type: "display" as const,
                },
              ]
            : []),
          ...(performanceData?.cpu
            ? [
                {
                  id: "cpu-usage",
                  label: "CPU Usage",
                  description: "Current CPU utilization",
                  icon: "⚙️",
                  iconBgColor: "bg-red-500/20",
                  value: `${performanceData.cpu.usage.toFixed(1)}%`,
                  type: "display" as const,
                },
              ]
            : []),
        ],
      },

      // Alerts
      ...(alertData && alertData.count > 0
        ? [
            {
              id: "alerts",
              title: "Active Alerts",
              description: `${alertData.count} active system ${alertData.count === 1 ? "alert" : "alerts"}`,
              items: alertData.alerts.slice(0, 5).map((alert) => ({
                id: `alert-${alert.id}`,
                label: alert.message,
                description: formatDate(alert.timestamp),
                icon: "⚠️",
                iconBgColor:
                  alert.severity === "critical"
                    ? "bg-red-500/20"
                    : alert.severity === "warning"
                      ? "bg-yellow-500/20"
                      : "bg-blue-500/20",
                status: alert.severity.toUpperCase(),
                statusColor:
                  alert.severity === "critical"
                    ? "bg-red-400"
                    : alert.severity === "warning"
                      ? "bg-yellow-400"
                      : "bg-blue-400",
              })),
            },
          ]
        : []),

      // Backup Management
      {
        id: "backups",
        title: "Database Backups",
        description: "Create and manage database backups",
        headerAction: {
          label: "Create Backup",
          icon: Download,
          variant: "default",
          onClick: onCreateBackup,
        },
        items: [
          ...(backupData?.stats
            ? [
                {
                  id: "backup-stats",
                  label: "Total Backups",
                  description: `Using ${formatBytes(backupData.stats.totalSize)} of storage`,
                  icon: "📦",
                  iconBgColor: "bg-indigo-500/20",
                  value: backupData.stats.totalBackups.toString(),
                  type: "display" as const,
                },
              ]
            : []),
          ...(backupData?.backups && backupData.backups.length > 0
            ? backupData.backups.slice(0, 5).map((backup) => ({
                id: `backup-${backup.filename}`,
                label: backup.filename,
                description: `${formatDate(backup.created)} • ${formatBytes(backup.size)}`,
                icon: "💾",
                iconBgColor: "bg-blue-500/20",
                status: backup.type,
                statusColor:
                  backup.type === "manual" ? "bg-purple-400" : "bg-green-400",
                actions: [
                  {
                    label: "Delete",
                    icon: Trash2,
                    variant: "danger" as const,
                    onClick: () => onDeleteBackup(backup.filename),
                  },
                ],
              }))
            : [
                {
                  id: "no-backups",
                  label: "No backups found",
                  description:
                    "Click 'Create Backup' above to create your first backup",
                  icon: "📦",
                  iconBgColor: "bg-white/5",
                },
              ]),
        ],
      },

      // Library Statistics
      {
        id: "library-stats",
        title: "Library Statistics",
        description: "Media library and user counts for monitoring",
        headerAction: {
          label: "Refresh Stats",
          icon: Database,
          variant: "modification",
          onClick: onUpdateMetrics,
        },
        items: [
          {
            id: "stats-info",
            label: "Statistics Auto-Update",
            description:
              "Library counts (movies, TV shows, users) update automatically every 60 seconds. Use 'Refresh Stats' to force an immediate update.",
            icon: "📊",
            iconBgColor: "bg-green-500/20",
            type: "display" as const,
          },
        ],
      },

      // Logging
      {
        id: "logging",
        title: "Application Logs",
        description: "View and manage application logs",
        items: [
          {
            id: "log-location",
            label: "Log Directory",
            description: "Application logs are stored locally",
            icon: "📝",
            iconBgColor: "bg-gray-500/20",
            value: "apps/api/logs/",
            type: "display" as const,
          },
          {
            id: "log-retention",
            label: "Log Retention",
            description: "Application logs: 14 days, Error logs: 30 days",
            icon: "🗓️",
            iconBgColor: "bg-gray-500/20",
            type: "display" as const,
          },
        ],
      },
    ],
  };
}
