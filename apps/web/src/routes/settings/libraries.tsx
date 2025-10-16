import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SettingGroup } from "@/components/settings/setting-group";
import { LibraryFormDialog } from "@/components/settings/library-form-dialog";
import { LibraryDeleteDialog } from "@/components/settings/library-delete-dialog";
import { TmdbApiKeyDialog } from "@/components/settings/tmdb-api-key-dialog";
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

export const Route = createFileRoute("/settings/libraries")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: libraries = [], isLoading } = useLibraries();
  const { data: settings } = useSettings();
  const deleteLibrary = useDeleteLibrary();
  const updateLibraries = useUpdateLibraries();
  const scanLibrary = useScanLibrary();
  const updateSettings = useUpdateSettings();
  const cleanupOrphaned = useCleanupOrphanedMedia();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<
    Collection | undefined
  >();
  const [scanningLibrary, setScanningLibrary] = useState<string | null>(null);
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

    setScanningLibrary(library.name || library.id || "Unknown Library");
    try {
      await scanLibrary.mutateAsync({
        path: library.libraryPath,
        mediaType: library.libraryType,
      });
    } finally {
      // Keep the message visible for a moment before clearing
      setTimeout(() => setScanningLibrary(null), 3000);
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
      <div className="h-full flex flex-col p-4 rounded-xl">
        {/* Fixed Header */}
        <header className="space-y-1 pb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-white/60">{config.description}</p>
        </header>

        {/* Scrollable Content with Gradient Masks */}
        <div className="relative flex-1 overflow-hidden">
          {/* Top Gradient Mask */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 via-background/40 to-transparent pointer-events-none z-10" />

          {/* Scrollable Content */}
          <div
            className="h-full overflow-y-auto space-y-6 px-1 py-8"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
            }}
          >
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

                {/* Show scan progress before the library manager group */}
                {index === 0 &&
                  (scanLibrary.isPending ||
                    scanLibrary.isSuccess ||
                    scanLibrary.isError) &&
                  scanningLibrary && (
                    <div className="mb-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        {scanLibrary.isPending && (
                          <>
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                Scanning library: {scanningLibrary}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                Scanning media files, fetching metadata from
                                TMDB, and updating your collection...
                              </p>
                            </div>
                          </>
                        )}
                        {scanLibrary.isSuccess && (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                Scan completed: {scanningLibrary}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                Library scan finished. All media has been
                                updated with the latest metadata from TMDB.
                              </p>
                            </div>
                          </>
                        )}
                        {scanLibrary.isError && (
                          <>
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                Scan failed: {scanningLibrary}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                {scanLibrary.error instanceof Error
                                  ? scanLibrary.error.message
                                  : "An error occurred while scanning the library."}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                <SettingGroup group={group} />
              </div>
            ))}
          </div>

          {/* Bottom Gradient Mask */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
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
