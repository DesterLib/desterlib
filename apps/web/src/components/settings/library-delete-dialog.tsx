import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Collection } from "@dester/api-client";

interface LibraryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  library?: Collection;
  isDeleting?: boolean;
}

export function LibraryDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  library,
  isDeleting,
}: LibraryDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/10 backdrop-blur-xl rounded-3xl border-white/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            Delete Library
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Are you sure you want to delete this library?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-sm font-semibold text-white/90">
              {library?.name}
            </p>
            {library?.libraryPath && (
              <p className="text-xs text-white/60 mt-1.5 font-mono">
                {library.libraryPath}
              </p>
            )}
            {library?.libraryType && (
              <p className="text-xs text-white/50 mt-1">
                Type: {library.libraryType.replace("_", " ")}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400 leading-relaxed">
              <strong className="font-semibold">Warning:</strong> This action
              cannot be undone. The library and all its media associations will
              be permanently removed.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
