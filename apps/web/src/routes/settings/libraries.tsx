import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import {
  useLibraries,
  useUpdateLibrary,
  useDeleteLibrary,
  useCreateLibrary,
} from "@/hooks/api/useLibraries";
import { useSettings } from "@/hooks/api/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/custom/icon";
import type {
  Library,
  MediaType,
  LibraryCreateRequest,
  ScanProgress,
  ScanComplete,
  ScanError,
} from "@/types/api";

const MEDIA_TYPES: MediaType[] = ["MOVIE", "TV_SHOW", "MUSIC", "COMIC"];

const getMediaTypeIcon = (type: MediaType | null) => {
  switch (type) {
    case "MOVIE":
      return <Icon name="movie" size={16} className="text-primary" />;
    case "TV_SHOW":
      return <Icon name="tv" size={16} className="text-primary" />;
    case "MUSIC":
      return <Icon name="music_note" size={16} className="text-primary" />;
    case "COMIC":
      return <Icon name="folder" size={16} className="text-primary" />;
    default:
      return (
        <Icon
          name="library_books"
          size={16}
          className="text-muted-foreground"
        />
      );
  }
};

const formatMediaCount = (count: number) => {
  if (count === 0) return "No media";
  if (count === 1) return "1 item";
  return `${count.toLocaleString()} items`;
};

const libraryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  backdropUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  libraryPath: z.string().optional(),
  libraryType: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]).optional(),
});

const libraryCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  backdropUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  libraryPath: z.string().min(1, "Library path is required for scanning"),
  libraryType: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]).optional(),
});

type LibraryUpdateForm = z.infer<typeof libraryUpdateSchema>;
type LibraryCreateForm = z.infer<typeof libraryCreateSchema>;

export const Route = createFileRoute("/settings/libraries")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: libraries, isLoading, error } = useLibraries();
  const { data: settings } = useSettings();
  const updateLibrary = useUpdateLibrary();
  const deleteLibrary = useDeleteLibrary();
  const createLibrary = useCreateLibrary();
  const navigate = useNavigate();

  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [deletingLibrary, setDeletingLibrary] = useState<Library | null>(null);
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  const [scanningLibraryId, setScanningLibraryId] = useState<string | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanComplete, setScanComplete] = useState<ScanComplete | null>(null);
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const currentScanningLibraryIdRef = useRef<string | null>(null);

  // WebSocket connection for scan progress updates
  useEffect(() => {
    if (!isScanning) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as
          | ScanProgress
          | ScanComplete
          | ScanError;

        // Handle scan progress messages
        if (data.type === "scan:progress") {
          // If we don't have a library ID yet, set it from the first progress message
          if (data.libraryId && !currentScanningLibraryIdRef.current) {
            currentScanningLibraryIdRef.current = data.libraryId;
            setScanningLibraryId(data.libraryId);
          }
          // Accept progress if we're scanning and either no library ID set yet or IDs match
          if (
            !currentScanningLibraryIdRef.current ||
            data.libraryId === currentScanningLibraryIdRef.current
          ) {
            setScanProgress(data);
          }
        } else if (data.type === "scan:complete") {
          // Accept complete if we're scanning and either no library ID set yet or IDs match
          if (
            !currentScanningLibraryIdRef.current ||
            data.libraryId === currentScanningLibraryIdRef.current
          ) {
            setScanComplete(data);
            setScanProgress(null);
            // Clear scanning state after a delay
            setTimeout(() => {
              currentScanningLibraryIdRef.current = null;
              setScanningLibraryId(null);
              setIsScanning(false);
              setScanComplete(null);
              setScanError(null);
            }, 3000);
          }
        } else if (data.type === "scan:error") {
          // Accept errors - they don't need library ID validation
          setScanError(data);
          setScanProgress(null);
          // Clear scanning state after a delay for errors too
          setTimeout(() => {
            currentScanningLibraryIdRef.current = null;
            setScanningLibraryId(null);
            setIsScanning(false);
            setScanComplete(null);
            setScanError(null);
          }, 5000);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [isScanning, scanningLibraryId]);

  const updateForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      posterUrl: "",
      backdropUrl: "",
      libraryPath: "",
      libraryType: undefined as MediaType | undefined,
    } as LibraryUpdateForm,
    onSubmit: async ({ value }) => {
      if (!editingLibrary) return;

      try {
        const validatedData = libraryUpdateSchema.parse(value);
        await updateLibrary.mutateAsync({
          id: editingLibrary.id,
          ...validatedData,
          description: validatedData.description || undefined,
          posterUrl: validatedData.posterUrl || undefined,
          backdropUrl: validatedData.backdropUrl || undefined,
          libraryPath: validatedData.libraryPath || undefined,
        });
        setEditingLibrary(null);
      } catch (error) {
        console.error("Failed to update library:", error);
      }
    },
  });

  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      posterUrl: "",
      backdropUrl: "",
      libraryPath: "",
      libraryType: undefined as MediaType | undefined,
    } as LibraryCreateForm,
    onSubmit: async ({ value }) => {
      try {
        const validatedData = libraryCreateSchema.parse(value);

        const createData: LibraryCreateRequest = {
          name: validatedData.name,
          description: validatedData.description || undefined,
          posterUrl: validatedData.posterUrl || undefined,
          backdropUrl: validatedData.backdropUrl || undefined,
          libraryPath: validatedData.libraryPath, // Now required by schema
          libraryType: validatedData.libraryType,
        };

        // Close modal immediately and start showing progress
        setCreatingLibrary(false);
        setIsScanning(true);
        setScanProgress(null);
        setScanComplete(null);
        setScanError(null);
        setScanningLibraryId(null); // Will be set from WebSocket messages
        currentScanningLibraryIdRef.current = null; // Reset ref

        // Call createLibrary which will trigger a scan automatically
        await createLibrary.mutateAsync(createData);
      } catch (error) {
        console.error("Failed to create library:", error);
        // Clear scanning state and show error
        setIsScanning(false);
        setScanningLibraryId(null);
        currentScanningLibraryIdRef.current = null;
        setScanProgress(null);
        setScanComplete(null);
        setScanError({
          type: "scan:error",
          error:
            error instanceof Error ? error.message : "Failed to create library",
        });
      }
    },
  });

  const handleEdit = (library: Library) => {
    setEditingLibrary(library);
    updateForm.setFieldValue("name", library.name);
    updateForm.setFieldValue("description", library.description || "");
    updateForm.setFieldValue("posterUrl", library.posterUrl || "");
    updateForm.setFieldValue("backdropUrl", library.backdropUrl || "");
    updateForm.setFieldValue("libraryPath", library.libraryPath || "");
    updateForm.setFieldValue("libraryType", library.libraryType || undefined);
  };

  const handleCreateNew = () => {
    // Check if TMDB API key is configured
    if (!settings?.tmdbApiKey || settings.tmdbApiKey.trim() === "") {
      // Redirect to general settings page highlighting the TMDB input
      navigate({
        to: "/settings/general",
        search: { highlight: "tmdb" },
      });
      return;
    }

    setCreatingLibrary(true);
    createForm.reset();
  };

  const handleDelete = async () => {
    if (!deletingLibrary) return;

    try {
      await deleteLibrary.mutateAsync({ id: deletingLibrary.id });
      setDeletingLibrary(null);
    } catch (error) {
      console.error("Failed to delete library:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading libraries...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Icon name="warning" size={32} className="text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error loading libraries
          </h3>
          <p className="text-destructive max-w-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              Libraries
            </h2>
            <p className="text-muted-foreground">
              Manage your media libraries. You can update library information
              and delete unused libraries.
            </p>
          </div>
          {libraries && libraries.length > 0 && (
            <Button onClick={handleCreateNew} className="gap-2">
              <Icon name="add" size={20} />
              Create Library
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {libraries?.map((library) => (
          <div
            key={library.id}
            className="group relative bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-border/80"
          >
            {/* Header with icon and title */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/5 border border-primary/10 text-primary flex-shrink-0">
                  {getMediaTypeIcon(library.libraryType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-foreground mb-2 leading-tight">
                    {library.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={library.isLibrary ? "default" : "secondary"}
                      className="text-xs font-medium"
                    >
                      {library.isLibrary ? "Library" : "Collection"}
                    </Badge>
                    {library.libraryType && (
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1.5 border-primary/20"
                      >
                        {getMediaTypeIcon(library.libraryType)}
                        {library.libraryType.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEdit(library)}
                  title="Edit library"
                  className="h-10 w-10 hover:bg-primary/5 hover:border-primary/20"
                >
                  <Icon name="edit" size={18} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setDeletingLibrary(library)}
                  className="h-10 w-10 hover:bg-destructive/5 hover:border-destructive/20 hover:text-destructive"
                  title="Delete library"
                >
                  <Icon name="delete" size={18} />
                </Button>
              </div>
            </div>

            {/* Description */}
            {library.description && (
              <div className="mb-6">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {library.description}
                </p>
              </div>
            )}

            {/* Stats and info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/10">
                  <Icon
                    name="video_library"
                    size={18}
                    className="text-primary"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatMediaCount(library.mediaCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Media items
                  </div>
                </div>
              </div>

              {library.libraryPath && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/10">
                    <Icon
                      name="folder_open"
                      size={18}
                      className="text-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {library.libraryPath.split("/").pop() ||
                        library.libraryPath}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {library.libraryPath}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/10">
                  <Icon
                    name="calendar_today"
                    size={18}
                    className="text-primary"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(library.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>
            </div>

            {/* Scan Progress */}
            {scanningLibraryId === library.id && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="space-y-4">
                  {scanProgress && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {scanProgress.message}
                          </span>
                          <span className="text-muted-foreground">
                            {scanProgress.progress}%
                          </span>
                        </div>
                        <Progress
                          value={scanProgress.progress}
                          className="w-full"
                        />
                        {scanProgress.total > 0 && (
                          <div className="text-xs text-muted-foreground text-center">
                            {scanProgress.current} of {scanProgress.total} items
                            processed
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                          <Icon
                            name={
                              scanProgress.phase === "scanning"
                                ? "folder_open"
                                : scanProgress.phase === "fetching-metadata"
                                  ? "cloud_download"
                                  : scanProgress.phase === "fetching-episodes"
                                    ? "tv"
                                    : "save"
                            }
                            size={14}
                            className="text-primary"
                          />
                        </div>
                        <span className="text-muted-foreground capitalize">
                          {scanProgress.phase.replace("-", " ")}
                        </span>
                      </div>
                    </>
                  )}

                  {scanComplete && scanComplete.libraryId === library.id && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                        <Icon
                          name="check"
                          size={20}
                          className="text-green-600"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-800">
                          Scan Complete
                        </div>
                        <div className="text-xs text-green-600">
                          {scanComplete.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {scanError &&
                    (scanError.libraryId === library.id ||
                      !scanError.libraryId) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                          <Icon
                            name="error"
                            size={20}
                            className="text-red-600"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-red-800">
                            Scan Failed
                          </div>
                          <div className="text-xs text-red-600">
                            {scanError.error}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Fallback progress for library not yet in list */}
        {isScanning &&
          (!scanningLibraryId ||
            !libraries?.find((lib) => lib.id === scanningLibraryId)) &&
          (scanProgress || scanComplete || scanError) && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Icon
                      name="folder_open"
                      size={20}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Creating Library
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Library is being created and scanned...
                    </p>
                  </div>
                </div>

                {scanProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {scanProgress.message}
                      </span>
                      <span className="text-muted-foreground">
                        {scanProgress.progress}%
                      </span>
                    </div>
                    <Progress
                      value={scanProgress.progress}
                      className="w-full"
                    />
                    {scanProgress.total > 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        {scanProgress.current} of {scanProgress.total} items
                        processed
                      </div>
                    )}
                  </div>
                )}

                {scanError && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                      <Icon name="error" size={20} className="text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-800">
                        Scan Failed
                      </div>
                      <div className="text-xs text-red-600">
                        {scanError.error}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {libraries?.length === 0 && !isScanning && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <Icon name="library_books" size={40} className="text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              No libraries found
            </h3>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              You don't have any libraries set up yet. Create your first library
              to get started managing your media collection.
            </p>
            <Button onClick={handleCreateNew} size="lg" className="gap-2">
              <Icon name="add" size={20} />
              Create Your First Library
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingLibrary}
        onOpenChange={(open) => !open && setEditingLibrary(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Edit Library
            </DialogTitle>
            <DialogDescription>
              Update the library information below.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <updateForm.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryUpdateSchema.shape.name.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid name";
                    }
                    return "Invalid name";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </updateForm.Field>

            <updateForm.Field
              name="description"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryUpdateSchema.shape.description.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid description";
                    }
                    return "Invalid description";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </updateForm.Field>

            <updateForm.Field name="libraryType">
              {(field) => (
                <Field>
                  <FieldLabel>Library Type</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value || "none"}
                      onValueChange={(value) =>
                        field.handleChange(
                          value === "none" ? undefined : (value as MediaType)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select library type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {MEDIA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              )}
            </updateForm.Field>

            <updateForm.Field
              name="posterUrl"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return undefined;
                  try {
                    libraryUpdateSchema.shape.posterUrl.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid URL";
                    }
                    return "Invalid URL";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Poster URL</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com/poster.jpg"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </updateForm.Field>

            <updateForm.Field
              name="backdropUrl"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return undefined;
                  try {
                    libraryUpdateSchema.shape.backdropUrl.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid URL";
                    }
                    return "Invalid URL";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Backdrop URL</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com/backdrop.jpg"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </updateForm.Field>

            <updateForm.Field
              name="libraryPath"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryUpdateSchema.shape.libraryPath.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid path";
                    }
                    return "Invalid path";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Library Path</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="/path/to/library"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Optional file system path for this library
                  </FieldDescription>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </updateForm.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingLibrary(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateLibrary.isPending}>
                {updateLibrary.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingLibrary}
        onOpenChange={(open) => !open && setDeletingLibrary(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Delete Library
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingLibrary?.name}"? This
              action cannot be undone.
              {deletingLibrary?.mediaCount && (
                <span className="block mt-2 text-destructive">
                  This will also delete {deletingLibrary.mediaCount} media
                  items.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLibrary(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLibrary.isPending}
            >
              {deleteLibrary.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Library Dialog */}
      <Dialog
        open={creatingLibrary}
        onOpenChange={(open) => !open && setCreatingLibrary(false)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Create New Library
            </DialogTitle>
            <DialogDescription>
              Create a new library and automatically scan the provided path for
              media files.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <createForm.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryCreateSchema.shape.name.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid name";
                    }
                    return "Invalid name";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="My Library"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </createForm.Field>

            <createForm.Field
              name="description"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryUpdateSchema.shape.description.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid description";
                    }
                    return "Invalid description";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                      placeholder="Optional description for your library"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </createForm.Field>

            <createForm.Field name="libraryType">
              {(field) => (
                <Field>
                  <FieldLabel>Library Type</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value || "none"}
                      onValueChange={(value) =>
                        field.handleChange(
                          value === "none" ? undefined : (value as MediaType)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select library type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {MEDIA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              )}
            </createForm.Field>

            <createForm.Field
              name="libraryPath"
              validators={{
                onChange: ({ value }) => {
                  try {
                    libraryCreateSchema.shape.libraryPath.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid path";
                    }
                    return "Invalid path";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Library Path</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="/path/to/your/media"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldDescription>
                    File system path to scan for media files. The library will
                    be created and scanned automatically.
                  </FieldDescription>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </createForm.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatingLibrary(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLibrary.isPending}>
                {createLibrary.isPending
                  ? "Creating & Scanning..."
                  : "Create Library"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
