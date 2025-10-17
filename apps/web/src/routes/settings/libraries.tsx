import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SettingGroup } from "@/components/settings/setting-group";
import { LibraryFormDialog } from "@/components/settings/library-form-dialog";
import { LibraryDeleteDialog } from "@/components/settings/library-delete-dialog";
import { TmdbApiKeyDialog } from "@/components/settings/tmdb-api-key-dialog";
import { ScanProgressCard } from "@/components/settings/scan-progress-card";
import {
  useLibraries,
  useDeleteLibrary,
  useUpdateLibraries,
  useScanLibrary,
  useCleanupOrphanedMedia,
} from "@/lib/hooks/useLibraries";
import { useSettings, useUpdateSettings } from "@/lib/hooks/useSettings";
import { librariesSettingsConfig } from "@/config/libraries-settings-config";
import type { Collection } from "@dester/api-client";
import type { MediaType } from "@/lib/schemas/library.schema";
import { useAuth } from "@/hooks/useAuth";
import { useScanProgress } from "@/hooks/useScanProgress";
import { blockGuests } from "@/lib/route-guards";

export const Route = createFileRoute("/settings/libraries")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require authenticated user (block guests) - redirects to login if not authenticated
    await blockGuests();
  },
});

function RouteComponent() {
  const { user } = useAuth();
  const { data: libraries = [], isLoading } = useLibraries();
  const { data: settings } = useSettings();
  const deleteLibrary = useDeleteLibrary();
  const updateLibraries = useUpdateLibraries();
  const scanLibrary = useScanLibrary();
  const updateSettings = useUpdateSettings();
  const cleanupOrphaned = useCleanupOrphanedMedia();
  const { activeScan } = useScanProgress();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<
    Collection | undefined
  >();

  // Handle adding a new library
  const handleAddLibrary = async (values: {
    name: string;
    path: string;
    type: MediaType;
    description?: string;
  }) => {
    const updatedLibraries = [
      ...libraries.map((lib: Collection) => ({
        name: lib.name || "Unnamed Library",
        type: lib.libraryType || "MOVIE",
        path: lib.libraryPath || "",
      })),
      {
        name: values.name,
        type: values.type,
        path: values.path,
      },
    ];

    await updateLibraries.mutateAsync(updatedLibraries);
  };

  // Handle editing a library
  const handleEditLibrary = async (values: {
    name: string;
    path: string;
    type: MediaType;
    description?: string;
  }) => {
    if (!selectedLibrary) return;

    const updatedLibraries = libraries.map((lib: Collection) => ({
      name:
        lib.id === selectedLibrary.id
          ? values.name
          : lib.name || "Unnamed Library",
      type:
        lib.id === selectedLibrary.id
          ? values.type
          : lib.libraryType || "MOVIE",
      path: lib.id === selectedLibrary.id ? values.path : lib.libraryPath || "",
    }));

    await updateLibraries.mutateAsync(updatedLibraries);
  };

  // Handle deleting a library
  const handleDeleteLibrary = async () => {
    if (!selectedLibrary?.id) return;
    await deleteLibrary.mutateAsync(selectedLibrary.id);
  };

  // Track which library is currently scanning
  const [scanningLibraryId, setScanningLibraryId] = useState<string | null>(
    null
  );
  const [isScanningAll, setIsScanningAll] = useState(false);

  // Handle scanning a library
  const handleScanLibrary = async (library: Collection) => {
    if (!library.libraryPath || !library.libraryType || !library.id) return;

    setScanningLibraryId(library.id || null);
    try {
      await scanLibrary.mutateAsync({
        path: library.libraryPath,
        mediaType: library.libraryType,
        updateExisting: true, // Force metadata refresh including genres
      });

      toast.success("Library scan complete", {
        description: "Metadata and genres have been updated",
      });
    } catch (error) {
      toast.error("Scan failed", {
        description:
          error instanceof Error ? error.message : "Failed to scan library",
      });
    } finally {
      setScanningLibraryId(null);
    }
  };

  // Handle scanning all libraries
  const handleScanAll = async (librariesToScan: Collection[]) => {
    setIsScanningAll(true);
    try {
      for (const lib of librariesToScan) {
        await handleScanLibrary(lib);
      }
      toast.success("All libraries scanned", {
        description: `Successfully scanned ${librariesToScan.length} ${librariesToScan.length === 1 ? "library" : "libraries"}`,
      });
    } catch (error) {
      toast.error("Batch scan failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to scan all libraries",
      });
    } finally {
      setIsScanningAll(false);
    }
  };

  // Handle TMDB API key update
  const handleUpdateTmdbKey = async (apiKey: string) => {
    await updateSettings.mutateAsync({ tmdbApiKey: apiKey });
  };

  // Handle settings updates (toggles, etc.)
  const handleUpdateSetting = async (key: string, value: unknown) => {
    await updateSettings.mutateAsync({ [key]: value } as Parameters<
      typeof updateSettings.mutateAsync
    >[0]);
  };

  // Handle cleanup orphaned media
  const handleCleanupOrphaned = async () => {
    try {
      const result = await cleanupOrphaned.mutateAsync();
      const deletedCount = result?.deleted ?? 0;
      if (deletedCount > 0) {
        toast.success("Cleanup complete", {
          description: `Removed ${deletedCount} orphaned media item${deletedCount === 1 ? "" : "s"}`,
        });
      } else {
        toast.info("No orphaned media found");
      }
    } catch {
      toast.error("Failed to clean up orphaned media");
    }
  };

  // Generate the config dynamically with real data
  const config = librariesSettingsConfig({
    libraries,
    settings: settings || undefined,
    onAddLibrary: () => setAddDialogOpen(true),
    onEditLibrary: (library) => {
      setSelectedLibrary(library);
      setEditDialogOpen(true);
    },
    onDeleteLibrary: (library) => {
      setSelectedLibrary(library);
      setDeleteDialogOpen(true);
    },
    onScanLibrary: handleScanLibrary,
    onScanAll: handleScanAll,
    onUpdateSetting: handleUpdateSetting,
    onConfigureTmdb: () => setTmdbDialogOpen(true),
    onCleanupOrphaned: handleCleanupOrphaned,
    currentUserId: user?.id,
    currentUserRole: user?.role,
    scanningLibraryId,
    isScanningAll,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/60">Loading libraries...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:h-full md:py-4">
        {/* Fixed Header */}
        <header className="space-y-1 pb-4 flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold">{config.title}</h1>
          <p className="text-xs md:text-sm text-white/60">
            {config.description}
          </p>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 md:overflow-y-auto space-y-6">
          {/* Show real-time scan progress */}
          {activeScan && <ScanProgressCard progress={activeScan} />}

          {/* Render setting groups */}
          {config.groups.map((group) => (
            <SettingGroup key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Add Library Dialog */}
      <LibraryFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddLibrary}
        mode="add"
      />

      {/* Edit Library Dialog */}
      <LibraryFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditLibrary}
        library={selectedLibrary}
        mode="edit"
      />

      {/* Delete Library Dialog */}
      <LibraryDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteLibrary}
        library={selectedLibrary}
        isDeleting={deleteLibrary.isPending}
      />

      {/* TMDB API Key Dialog */}
      <TmdbApiKeyDialog
        open={tmdbDialogOpen}
        onOpenChange={setTmdbDialogOpen}
        onSubmit={handleUpdateTmdbKey}
        currentApiKey={settings?.tmdbApiKey || undefined}
      />
    </>
  );
}
