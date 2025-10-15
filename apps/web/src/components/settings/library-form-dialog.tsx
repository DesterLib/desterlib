import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type MediaType } from "@/lib/schemas/library.schema";
import type { Collection } from "@dester/api-client";

interface LibraryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    name: string;
    path: string;
    type: MediaType;
    description?: string;
  }) => Promise<void>;
  library?: Collection;
  mode: "add" | "edit";
}

export function LibraryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  library,
  mode,
}: LibraryFormDialogProps) {
  const form = useForm({
    defaultValues: {
      name: library?.name || "",
      path: library?.libraryPath || "",
      type: (library?.libraryType || "MOVIE") as MediaType,
      description: library?.description || "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 backdrop-blur-xl rounded-3xl border-white/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            {mode === "add" ? "Add Library" : "Edit Library"}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {mode === "add"
              ? "Add a new library to organize your media collection."
              : "Update your library settings."}
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
          {/* Name Field */}
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-white/90"
                >
                  Library Name *
                </Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g., Movies, TV Shows, Music"
                  className="bg-white/5 border-white/10 focus:border-white/20"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Type Field */}
          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  className="text-sm font-medium text-white/90"
                >
                  Library Type *
                </Label>
                <Select
                  id="type"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.target.value as MediaType)
                  }
                  onBlur={field.handleBlur}
                  className="bg-white/5 border-white/10 focus:border-white/20"
                >
                  <option value="MOVIE">Movies</option>
                  <option value="TV_SHOW">TV Shows</option>
                  <option value="MUSIC">Music</option>
                  <option value="COMIC">Comics</option>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Path Field */}
          <form.Field name="path">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="path"
                  className="text-sm font-medium text-white/90"
                >
                  Library Path *
                </Label>
                <Input
                  id="path"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="/path/to/media/folder"
                  className="bg-white/5 border-white/10 focus:border-white/20 font-mono text-sm"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Description Field */}
          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-white/90"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Optional description for this library"
                  rows={3}
                  className="bg-white/5 border-white/10 focus:border-white/20 resize-none"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting
                ? "Saving..."
                : mode === "add"
                  ? "Add Library"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
