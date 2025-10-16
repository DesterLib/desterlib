import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHealth,
  getHealthReady,
  getHealthLive,
  getApiV1AdminHealthCheck,
  getApiV1AdminPerformance,
  postApiV1AdminPerformanceReset,
  getApiV1AdminAlerts,
  getApiV1AdminAlertsHistory,
  getApiV1AdminBackups,
  postApiV1AdminBackups,
  postApiV1AdminBackupsFilenameRestore,
  deleteApiV1AdminBackupsFilename,
  postApiV1AdminMetricsUpdate,
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
      const apiData = response.data as unknown as { data: HealthCheckResponse };
      return apiData.data ?? null;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useReadinessCheck() {
  return useQuery<ReadinessCheckResponse | null>({
    queryKey: ["health", "ready"],
    queryFn: async () => {
      const response = await getHealthReady();
      const apiData = response.data as unknown as {
        data: ReadinessCheckResponse;
      };
      return apiData.data ?? null;
    },
    refetchInterval: 30000,
  });
}

export function useLivenessCheck() {
  return useQuery<LivenessCheckResponse | null>({
    queryKey: ["health", "live"],
    queryFn: async () => {
      const response = await getHealthLive();
      const apiData = response.data as unknown as {
        data: LivenessCheckResponse;
      };
      return apiData.data ?? null;
    },
    refetchInterval: 30000,
  });
}

export function useAdminHealthCheck() {
  return useQuery<AdminHealthCheckResponse | null>({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await getApiV1AdminHealthCheck();
      const apiData = response.data as unknown as {
        data: AdminHealthCheckResponse;
      };
      return apiData.data ?? null;
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
      const response = await getApiV1AdminPerformance();
      const apiData = response.data as unknown as {
        data: PerformanceMetricsResponse;
      };
      return apiData.data ?? null;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useResetPerformanceMetrics() {
  const queryClient = useQueryClient();

  return useMutation<ResetPerformanceResponse | null>({
    mutationFn: async () => {
      const response = await postApiV1AdminPerformanceReset();
      const apiData = response.data as unknown as {
        data: ResetPerformanceResponse;
      };
      return apiData.data ?? null;
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
      const response = await getApiV1AdminAlerts();
      const apiData = response.data as unknown as {
        data: ActiveAlertsResponse;
      };
      return apiData.data ?? null;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

export function useAlertHistory() {
  return useQuery<AlertHistoryResponse | null>({
    queryKey: ["admin", "alerts", "history"],
    queryFn: async () => {
      const response = await getApiV1AdminAlertsHistory();
      const apiData = response.data as unknown as {
        data: AlertHistoryResponse;
      };
      return apiData.data ?? null;
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
      const response = await getApiV1AdminBackups();
      const apiData = response.data as unknown as { data: BackupsResponse };
      return apiData.data ?? null;
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation<CreateBackupResponse | null>({
    mutationFn: async () => {
      const response = await postApiV1AdminBackups();
      const apiData = response.data as unknown as {
        data: CreateBackupResponse;
      };
      return apiData.data ?? null;
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
      const response = await postApiV1AdminBackupsFilenameRestore(filename);
      const apiData = response.data as unknown as {
        data: RestoreBackupResponse;
      };
      return apiData.data ?? null;
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
      const response = await deleteApiV1AdminBackupsFilename(filename);
      const apiData = response.data as unknown as {
        data: DeleteBackupResponse;
      };
      return apiData.data ?? null;
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
      const response = await postApiV1AdminMetricsUpdate();
      const apiData = response.data as unknown as {
        data: UpdateMetricsResponse;
      };
      return apiData.data ?? null;
    },
  });
}
