import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { Loader2, ShieldAlert } from "lucide-react";
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

  // Handle creating a backup
  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
      // Toast notifications and loading state handled by useBackupProgress hook
    } catch (error) {
      // Error toast already shown by useBackupProgress
      console.error("Backup creation failed:", error);
    }
  };

  // Handle deleting a backup
  const handleDeleteBackup = async (filename: string) => {
    try {
      await deleteBackup.mutateAsync(filename);
      toast.success("Backup deleted", {
        description: filename,
      });
    } catch {
      toast.error("Failed to delete backup", {
        description: filename,
      });
    }
  };

  // Handle resetting performance metrics
  const handleResetPerformanceMetrics = async () => {
    try {
      await resetPerformanceMetrics.mutateAsync();
      toast.success("Performance metrics reset", {
        description: "Metrics have been cleared",
      });
    } catch {
      toast.error("Failed to reset performance metrics");
    }
  };

  // Handle updating business metrics
  const handleUpdateMetrics = async () => {
    try {
      await updateMetrics.mutateAsync();
      toast.success("Business metrics updated", {
        description: "Metrics have been recalculated",
      });
    } catch {
      toast.error("Failed to update business metrics");
    }
  };

  // Handle refreshing health check
  const handleRefreshHealth = () => {
    refetchHealth();
  };

  // Get real-time backup progress (uses toast notifications)
  const backupProgress = useBackupProgress();

  // Check if backup is in progress (only use WebSocket state)
  const isBackupInProgress =
    backupProgress.status === "starting" ||
    backupProgress.status === "in_progress";

  // Generate the config dynamically with real data
  const config = systemSettingsConfig({
    healthData,
    performanceData,
    alertData,
    backupData,
    isBackupInProgress,
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
    <div className="flex flex-col md:h-full md:py-4">
      {/* Fixed Header */}
      <header className="space-y-1 pb-4 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold">{config.title}</h1>
        <p className="text-xs md:text-sm text-white/60">{config.description}</p>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 md:overflow-y-auto space-y-6">
        {/* Render setting groups */}
        {config.groups.map((group) => (
          <SettingGroup key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
