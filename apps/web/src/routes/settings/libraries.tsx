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
} from "@/lib/hooks/useLibraries";
import { useSettings, useUpdateSettings } from "@/lib/hooks/useSettings";
import { librariesSettingsConfig } from "@/config/libraries-settings-config";
import type { Collection } from "@dester/api-client";
import type { MediaType } from "@/lib/schemas/library.schema";

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
        name: lib.name,
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
      name: lib.id === selectedLibrary.id ? values.name : lib.name,
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
    if (!selectedLibrary) return;
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

  // Generate the config dynamically with real data
  const config = librariesSettingsConfig({
    libraries,
    settings,
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
            {config.groups.map((group) => (
              <SettingGroup key={group.id} group={group} />
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
        currentApiKey={settings?.tmdbApiKey}
      />
    </>
  );
}
