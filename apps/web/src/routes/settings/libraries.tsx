import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import {
  useLibraries,
  useUpdateLibrary,
  useDeleteLibrary,
} from "@/hooks/api/useLibraries";
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
import { Icon } from "@/components/custom/icon";
import type { Library, MediaType } from "@/types/api";

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

type LibraryUpdateForm = z.infer<typeof libraryUpdateSchema>;

export const Route = createFileRoute("/settings/libraries")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: libraries, isLoading, error } = useLibraries();
  const updateLibrary = useUpdateLibrary();
  const deleteLibrary = useDeleteLibrary();

  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [deletingLibrary, setDeletingLibrary] = useState<Library | null>(null);
  const [creatingLibrary, setCreatingLibrary] = useState(false);

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
    } as LibraryUpdateForm,
    onSubmit: async ({ value }) => {
      try {
        const validatedData = libraryUpdateSchema.parse(value);
        // TODO: Implement create library API call when endpoint is available
        console.log("Would create library with data:", validatedData);
        setCreatingLibrary(false);
      } catch (error) {
        console.error("Failed to create library:", error);
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
            className="group relative bg-card border-2 border-border rounded-2xl p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
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
          </div>
        ))}

        {libraries?.length === 0 && (
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
              Create a new library to organize your media.
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatingLibrary(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Library</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
