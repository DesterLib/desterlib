import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { Loader2, CheckCircle, XCircle } from "lucide-react";
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
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

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

  // Handle scanning a library
  const handleScanLibrary = async (library: Collection) => {
    if (!library.libraryPath || !library.libraryType) return;

    await scanLibrary.mutateAsync({
      path: library.libraryPath,
      mediaType: library.libraryType,
    });
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
    setCleanupStatus("cleaning");
    try {
      const result = await cleanupOrphaned.mutateAsync();
      const deletedCount = result?.deleted ?? 0;
      if (deletedCount > 0) {
        setCleanupStatus(
          `Cleaned up ${deletedCount} orphaned media item${deletedCount === 1 ? "" : "s"}`
        );
      } else {
        setCleanupStatus("No orphaned media found");
      }
    } catch {
      setCleanupStatus("Failed to clean up orphaned media");
    } finally {
      setTimeout(() => setCleanupStatus(null), 5000);
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
    onUpdateSetting: handleUpdateSetting,
    onConfigureTmdb: () => setTmdbDialogOpen(true),
    onCleanupOrphaned: handleCleanupOrphaned,
    currentUserId: user?.id,
    currentUserRole: user?.role,
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
      <div className="flex flex-col px-4 md:p-4 rounded-xl md:h-full">
        {/* Fixed Header */}
        <header className="space-y-1 pb-4 pt-2 md:pt-0 flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold">{config.title}</h1>
          <p className="text-xs md:text-sm text-white/60">
            {config.description}
          </p>
        </header>

        {/* Scrollable Content with Gradient Masks */}
        <div className="md:relative md:flex-1 md:overflow-hidden">
          {/* Top Gradient Mask - Desktop only */}
          <div className="hidden md:block absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 via-background/40 to-transparent pointer-events-none z-10" />

          {/* Scrollable Content */}
          <div className="space-y-6 px-1 py-4 md:py-8 md:h-full md:overflow-y-auto">
            {config.groups.map((group, index) => (
              <div key={group.id}>
                {/* Show cleanup status */}
                {index === 0 && cleanupStatus && (
                  <div className="mb-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      {cleanupStatus === "cleaning" && (
                        <>
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              Cleaning up orphaned media...
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                              Removing media items not associated with any
                              library
                            </p>
                          </div>
                        </>
                      )}
                      {cleanupStatus !== "cleaning" && (
                        <>
                          {cleanupStatus.includes("Failed") ? (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-white">
                            {cleanupStatus}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Show real-time scan progress */}
                {index === 0 && activeScan && (
                  <div className="mb-4">
                    <ScanProgressCard progress={activeScan} />
                  </div>
                )}
                <SettingGroup group={group} />
              </div>
            ))}
          </div>

          {/* Bottom Gradient Mask - Desktop only */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
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
