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

  const form = useForm({
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

      // Validate using zod
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

  const handleEdit = (library: Library) => {
    setEditingLibrary(library);
    form.setFieldValue("name", library.name);
    form.setFieldValue("description", library.description || "");
    form.setFieldValue("posterUrl", library.posterUrl || "");
    form.setFieldValue("backdropUrl", library.backdropUrl || "");
    form.setFieldValue("libraryPath", library.libraryPath || "");
    form.setFieldValue("libraryType", library.libraryType || undefined);
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
    return <div className="p-6">Loading libraries...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading libraries: {error.message}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Libraries</h2>
        <p className="text-muted-foreground">
          Manage your media libraries. You can update library information and
          delete unused libraries.
        </p>
      </div>

      <div className="grid gap-6">
        {libraries?.map((library) => (
          <div
            key={library.id}
            className="group relative bg-card border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 hover:-translate-y-1"
          >
            {/* Header with icon and title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  {getMediaTypeIcon(library.libraryType)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {library.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={library.isLibrary ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {library.isLibrary ? "Library" : "Collection"}
                    </Badge>
                    {library.libraryType && (
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        {getMediaTypeIcon(library.libraryType)}
                        {library.libraryType.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEdit(library)}
                  title="Edit library"
                >
                  <Icon name="edit" size={20} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setDeletingLibrary(library)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                  title="Delete library"
                >
                  <Icon name="delete" size={20} />
                </Button>
              </div>
            </div>

            {/* Description */}
            {library.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {library.description}
              </p>
            )}

            {/* Stats and info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Icon
                  name="video_library"
                  size={20}
                  className="text-muted-foreground"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatMediaCount(library.mediaCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Media items
                  </div>
                </div>
              </div>

              {library.libraryPath && (
                <div className="flex items-center gap-3">
                  <Icon
                    name="folder_open"
                    size={20}
                    className="text-muted-foreground"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground truncate">
                      {library.libraryPath.split("/").pop() ||
                        library.libraryPath}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {library.libraryPath}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Icon
                  name="calendar_today"
                  size={20}
                  className="text-muted-foreground"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(library.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {libraries?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Icon
                name="library_books"
                size={32}
                className="text-muted-foreground"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No libraries found
            </h3>
            <p className="text-muted-foreground max-w-sm">
              You don't have any libraries set up yet. Create your first library
              to get started managing your media collection.
            </p>
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
            <DialogTitle>Edit Library</DialogTitle>
            <DialogDescription>
              Update the library information below.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
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
            </form.Field>

            <form.Field
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
            </form.Field>

            <form.Field name="libraryType">
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
            </form.Field>

            <form.Field
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
            </form.Field>

            <form.Field
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
            </form.Field>

            <form.Field
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
            </form.Field>

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
            <DialogTitle>Delete Library</DialogTitle>
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
    </div>
  );
}
