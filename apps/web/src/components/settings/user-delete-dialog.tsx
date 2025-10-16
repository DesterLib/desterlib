import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GetApiV1Users200UsersItem } from "@dester/api-client";
import { AlertTriangle } from "lucide-react";

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  user: GetApiV1Users200UsersItem;
  isDeleting: boolean;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  user,
  isDeleting,
}: UserDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white/10 backdrop-blur-xl rounded-3xl border-white/10">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Delete User
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-white/80">
            Are you sure you want to delete the user{" "}
            <span className="font-semibold text-white">
              {user.displayName || user.username}
            </span>
            ?
          </p>

          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 space-y-2">
            <p className="text-sm text-red-200 font-medium">
              This will permanently:
            </p>
            <ul className="text-sm text-red-200/80 space-y-1 ml-4 list-disc">
              <li>Remove the user account</li>
              <li>Delete all user sessions</li>
              <li>Remove user-specific settings and preferences</li>
              <li>Delete user's watch history and favorites</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="hover:bg-white/10"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
