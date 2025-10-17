import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SettingGroup } from "@/components/settings/setting-group";
import { systemSettingsConfig } from "@/config/system-settings-config";
import {
  usePerformanceMetrics,
  useActiveAlerts,
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useResetPerformanceMetrics,
  useUpdateMetrics,
  useAdminHealthCheck,
} from "@/lib/hooks/useSystem";
import { useAuth } from "@/hooks/useAuth";
import { useBackupProgress } from "@/hooks/useBackupProgress";
import { Loader2, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/route-guards";

export const Route = createFileRoute("/settings/system")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require admin role (ADMIN or SUPER_ADMIN) - redirects to login if not authenticated
    await requireAdmin();
  },
});

function RouteComponent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const { data: healthData, refetch: refetchHealth } = useAdminHealthCheck();
  const { data: performanceData } = usePerformanceMetrics();
  const { data: alertData } = useActiveAlerts();
  const { data: backupData } = useBackups();

  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const resetPerformanceMetrics = useResetPerformanceMetrics();
  const updateMetrics = useUpdateMetrics();

  // Get real-time backup progress
  const backupProgress = useBackupProgress();

  const [operationStatus, setOperationStatus] = useState<{
    type: string;
    message: string;
    status: "loading" | "success" | "error";
  } | null>(null);

  // Update operation status based on backup progress
  useEffect(() => {
    if (
      backupProgress.status === "starting" ||
      backupProgress.status === "in_progress"
    ) {
      const sizeText = backupProgress.bytesWritten
        ? ` (${(backupProgress.bytesWritten / 1024 / 1024).toFixed(2)} MB written)`
        : "";
      setOperationStatus({
        type: "backup",
        message: `Creating database backup...${sizeText}`,
        status: "loading",
      });
    } else if (backupProgress.status === "completed") {
      const sizeText = backupProgress.size
        ? ` (${(backupProgress.size / 1024 / 1024).toFixed(2)} MB)`
        : "";
      setOperationStatus({
        type: "backup",
        message: `Backup created successfully${sizeText}`,
        status: "success",
      });
    } else if (backupProgress.status === "error") {
      setOperationStatus({
        type: "backup",
        message: `Failed to create backup: ${backupProgress.error || "Unknown error"}`,
        status: "error",
      });
    }
  }, [backupProgress]);

  // Handle creating a backup
  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
      // Status updates will come from WebSocket events
    } catch {
      // Only set error if WebSocket didn't already report it
      if (backupProgress.status !== "error") {
        setOperationStatus({
          type: "backup",
          message: "Failed to create backup",
          status: "error",
        });
        setTimeout(() => setOperationStatus(null), 5000);
      }
    }
  };

  // Handle deleting a backup
  const handleDeleteBackup = async (filename: string) => {
    setOperationStatus({
      type: "backup",
      message: `Deleting backup ${filename}...`,
      status: "loading",
    });
    try {
      await deleteBackup.mutateAsync(filename);
      setOperationStatus({
        type: "backup",
        message: "Backup deleted successfully",
        status: "success",
      });
    } catch {
      setOperationStatus({
        type: "backup",
        message: "Failed to delete backup",
        status: "error",
      });
    } finally {
      setTimeout(() => setOperationStatus(null), 5000);
    }
  };

  // Handle resetting performance metrics
  const handleResetPerformanceMetrics = async () => {
    setOperationStatus({
      type: "performance",
      message: "Resetting performance metrics...",
      status: "loading",
    });
    try {
      await resetPerformanceMetrics.mutateAsync();
      setOperationStatus({
        type: "performance",
        message: "Performance metrics reset successfully",
        status: "success",
      });
    } catch {
      setOperationStatus({
        type: "performance",
        message: "Failed to reset performance metrics",
        status: "error",
      });
    } finally {
      setTimeout(() => setOperationStatus(null), 5000);
    }
  };

  // Handle updating business metrics
  const handleUpdateMetrics = async () => {
    setOperationStatus({
      type: "metrics",
      message: "Updating business metrics...",
      status: "loading",
    });
    try {
      await updateMetrics.mutateAsync();
      setOperationStatus({
        type: "metrics",
        message: "Business metrics updated successfully",
        status: "success",
      });
    } catch {
      setOperationStatus({
        type: "metrics",
        message: "Failed to update business metrics",
        status: "error",
      });
    } finally {
      setTimeout(() => setOperationStatus(null), 5000);
    }
  };

  // Handle refreshing health check
  const handleRefreshHealth = () => {
    refetchHealth();
  };

  // Generate the config dynamically with real data
  const config = systemSettingsConfig({
    healthData,
    performanceData,
    alertData,
    backupData,
    onRefreshHealth: handleRefreshHealth,
    onResetPerformanceMetrics: handleResetPerformanceMetrics,
    onCreateBackup: handleCreateBackup,
    onRestoreBackup: () => {}, // Not implemented yet
    onDeleteBackup: handleDeleteBackup,
    onUpdateMetrics: handleUpdateMetrics,
  });

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Admin Access Required
          </h2>
          <p className="text-white/60">
            This page is only accessible to administrators. Please contact your
            system administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 md:p-4 rounded-xl md:h-full">
      {/* Fixed Header */}
      <header className="space-y-1 pb-4 pt-2 md:pt-0 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold">{config.title}</h1>
        <p className="text-xs md:text-sm text-white/60">{config.description}</p>
      </header>

      {/* Scrollable Content with Gradient Masks */}
      <div className="md:relative md:flex-1 md:overflow-hidden">
        {/* Top Gradient Mask - Desktop only */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 via-background/40 to-transparent pointer-events-none z-10" />

        {/* Scrollable Content */}
        <div className="space-y-6 px-1 py-4 md:py-8 md:h-full md:overflow-y-auto">
          {/* Operation Status */}
          {operationStatus && (
            <div className="mb-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                {operationStatus.status === "loading" && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {operationStatus.message}
                      </p>
                    </div>
                  </>
                )}
                {operationStatus.status === "success" && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white">
                      {operationStatus.message}
                    </p>
                  </>
                )}
                {operationStatus.status === "error" && (
                  <>
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white">
                      {operationStatus.message}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Render setting groups */}
          {config.groups.map((group) => (
            <SettingGroup key={group.id} group={group} />
          ))}
        </div>

        {/* Bottom Gradient Mask - Desktop only */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
