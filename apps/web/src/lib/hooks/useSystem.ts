import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHealth,
  getHealthReady,
  getHealthLive,
  getAdminHealthCheck,
  getAdminPerformance,
  postAdminPerformanceReset,
  getAdminAlerts,
  getAdminAlertsHistory,
  getAdminBackups,
  postAdminBackups,
  postAdminBackupsFilenameRestore,
  deleteAdminBackupsFilename,
  postAdminMetricsUpdate,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured
import type {
  HealthCheckResponse,
  ReadinessCheckResponse,
  LivenessCheckResponse,
  AdminHealthCheckResponse,
  PerformanceMetricsResponse,
  ActiveAlertsResponse,
  AlertHistoryResponse,
  BackupsResponse,
  CreateBackupResponse,
  RestoreBackupResponse,
  DeleteBackupResponse,
  UpdateMetricsResponse,
  ResetPerformanceResponse,
} from "@/types/system";

// ────────────────────────────────────────────────────────────────────────────
// Health Checks
// ────────────────────────────────────────────────────────────────────────────

export function useHealthCheck() {
  return useQuery<HealthCheckResponse | null>({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await getHealth();
      return (
        (response.data as unknown as { data: HealthCheckResponse })?.data ??
        null
      );
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useReadinessCheck() {
  return useQuery<ReadinessCheckResponse | null>({
    queryKey: ["health", "ready"],
    queryFn: async () => {
      const response = await getHealthReady();
      return (
        (response.data as unknown as { data: ReadinessCheckResponse })?.data ??
        null
      );
    },
    refetchInterval: 30000,
  });
}

export function useLivenessCheck() {
  return useQuery<LivenessCheckResponse | null>({
    queryKey: ["health", "live"],
    queryFn: async () => {
      const response = await getHealthLive();
      return (
        (response.data as unknown as { data: LivenessCheckResponse })?.data ??
        null
      );
    },
    refetchInterval: 30000,
  });
}

export function useAdminHealthCheck() {
  return useQuery<AdminHealthCheckResponse | null>({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await getAdminHealthCheck();
      return (
        (response.data as unknown as { data: AdminHealthCheckResponse })
          ?.data ?? null
      );
    },
    refetchInterval: 30000,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Performance Metrics
// ────────────────────────────────────────────────────────────────────────────

export function usePerformanceMetrics() {
  return useQuery<PerformanceMetricsResponse | null>({
    queryKey: ["admin", "performance"],
    queryFn: async () => {
      const response = await getAdminPerformance();
      return (
        (response.data as unknown as { data: PerformanceMetricsResponse })
          ?.data ?? null
      );
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useResetPerformanceMetrics() {
  const queryClient = useQueryClient();

  return useMutation<ResetPerformanceResponse | null>({
    mutationFn: async () => {
      const response = await postAdminPerformanceReset();
      return (
        (response.data as unknown as { data: ResetPerformanceResponse })
          ?.data ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "performance"] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Alerting
// ────────────────────────────────────────────────────────────────────────────

export function useActiveAlerts() {
  return useQuery<ActiveAlertsResponse | null>({
    queryKey: ["admin", "alerts"],
    queryFn: async () => {
      const response = await getAdminAlerts();
      return (
        (response.data as unknown as { data: ActiveAlertsResponse })?.data ??
        null
      );
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

export function useAlertHistory() {
  return useQuery<AlertHistoryResponse | null>({
    queryKey: ["admin", "alerts", "history"],
    queryFn: async () => {
      const response = await getAdminAlertsHistory();
      return (
        (response.data as unknown as { data: AlertHistoryResponse })?.data ??
        null
      );
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Backups
// ────────────────────────────────────────────────────────────────────────────

export function useBackups() {
  return useQuery<BackupsResponse | null>({
    queryKey: ["admin", "backups"],
    queryFn: async () => {
      const response = await getAdminBackups();
      return (
        (response.data as unknown as { data: BackupsResponse })?.data ?? null
      );
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation<CreateBackupResponse | null>({
    mutationFn: async () => {
      const response = await postAdminBackups();
      return (
        (response.data as unknown as { data: CreateBackupResponse })?.data ??
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation<RestoreBackupResponse | null, Error, string>({
    mutationFn: async (filename: string) => {
      const response = await postAdminBackupsFilenameRestore(filename);
      return (
        (response.data as unknown as { data: RestoreBackupResponse })?.data ??
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation<DeleteBackupResponse | null, Error, string>({
    mutationFn: async (filename: string) => {
      const response = await deleteAdminBackupsFilename(filename);
      return (
        (response.data as unknown as { data: DeleteBackupResponse })?.data ??
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Metrics Update
// ────────────────────────────────────────────────────────────────────────────

export function useUpdateMetrics() {
  return useMutation<UpdateMetricsResponse | null>({
    mutationFn: async () => {
      const response = await postAdminMetricsUpdate();
      return (
        (response.data as unknown as { data: UpdateMetricsResponse })?.data ??
        null
      );
    },
  });
}
