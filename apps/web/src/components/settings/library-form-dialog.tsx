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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type MediaType } from "@/lib/schemas/library.schema";
import type { Collection } from "@dester/api-client";
import { FolderOpen } from "lucide-react";

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

  // Handle directory picker
  const handleBrowseClick = async () => {
    // Check if we're in Flutter WebView (webview_flutter)
    if (window.pickDirectory) {
      // Set up callback for Flutter to call back with the path
      window.flutter_directory_callback = (path: string) => {
        if (path) {
          form.setFieldValue("path", path);
        }
      };

      // Call Flutter's JavaScript channel
      try {
        window.pickDirectory.postMessage("");
      } catch (error) {
        console.error("Failed to call pickDirectory:", error);
        alert("Please enter the path manually");
      }
    } else {
      // For modern browsers: use File System Access API
      if ("showDirectoryPicker" in window) {
        try {
          // @ts-expect-error - showDirectoryPicker is not in TypeScript types yet
          const dirHandle = await window.showDirectoryPicker();
          // Note: We can't get the full absolute path in browsers for security reasons
          // But we can get the directory name which might be useful
          form.setFieldValue("path", dirHandle.name);
          alert(
            "Note: Browsers don't provide full paths for security. Please enter the full path manually (e.g., /media/movies)"
          );
        } catch (error) {
          // User cancelled or error occurred
          console.log("Directory picker cancelled or error:", error);
        }
      } else {
        // Fallback: inform user to enter path manually
        alert(
          "Directory picker not supported in this browser. Please enter the full path manually (e.g., /media/movies or C:\\Media\\Movies)"
        );
      }
    }
  };

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
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(value as MediaType)
                  }
                >
                  <SelectTrigger
                    id="type"
                    className="bg-white/5 border-white/10 focus:border-white/20"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOVIE">Movies</SelectItem>
                    <SelectItem value="TV_SHOW">TV Shows</SelectItem>
                    <SelectItem value="MUSIC">Music</SelectItem>
                    <SelectItem value="COMIC">Comics</SelectItem>
                  </SelectContent>
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
                <div className="flex gap-2">
                  <Input
                    id="path"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="/path/to/media/folder"
                    className="flex-1 bg-white/5 border-white/10 focus:border-white/20 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleBrowseClick}
                    className="flex-shrink-0 hover:bg-white/10"
                    title="Browse for folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
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
