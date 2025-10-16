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
import { Switch } from "@/components/ui/switch";
import type {
  GetApiV1Users200UsersItem,
  PutApiV1UsersUserIdBody,
} from "@dester/api-client";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PutApiV1UsersUserIdBody) => Promise<void>;
  user: GetApiV1Users200UsersItem;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
}: UserFormDialogProps) {
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const form = useForm({
    defaultValues: {
      email: user.email || "",
      displayName: user.displayName || "",
      role: user.role,
      isActive: user.isActive,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/10 backdrop-blur-xl rounded-3xl border-white/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            {isSuperAdmin ? "Edit Super Admin Profile" : "Edit User"}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {isSuperAdmin
              ? `Editing ${user.username} (Protected Super Admin - Limited changes allowed)`
              : `Update user information and permissions for ${user.username}.`}
          </DialogDescription>
        </DialogHeader>

        {isSuperAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-sm font-medium text-amber-200">
                  Super Admin Account
                </p>
                <p className="text-xs text-amber-300/80 mt-1">
                  This is the first user account with protected privileges. Role
                  and account status cannot be modified for security reasons.
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Display Name Field */}
          <form.Field name="displayName">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="text-sm font-medium text-white/90"
                >
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g., John Doe"
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

          {/* Email Field */}
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-white/90"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="user@example.com"
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

          {/* Role Field */}
          <form.Field name="role">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-sm font-medium text-white/90"
                >
                  Role{" "}
                  {isSuperAdmin && (
                    <span className="text-xs text-amber-400">(Protected)</span>
                  )}
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(
                      value as "SUPER_ADMIN" | "USER" | "ADMIN" | "GUEST"
                    )
                  }
                  disabled={isSuperAdmin}
                >
                  <SelectTrigger
                    id="role"
                    className="bg-white/5 border-white/10 focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN" disabled>
                      <div className="flex items-center gap-2">
                        <span>⭐</span>
                        <div>
                          <div className="font-medium">Super Administrator</div>
                          <div className="text-xs text-white/60">
                            Protected first user (cannot be assigned)
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <span>👑</span>
                        <div>
                          <div className="font-medium">Administrator</div>
                          <div className="text-xs text-white/60">
                            Full system access
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="USER">
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <div>
                          <div className="font-medium">User</div>
                          <div className="text-xs text-white/60">
                            Standard user permissions
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="GUEST">
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <div>
                          <div className="font-medium">Guest</div>
                          <div className="text-xs text-white/60">
                            Limited read-only access
                          </div>
                        </div>
                      </div>
                    </SelectItem>
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

          {/* Active Status Toggle */}
          <form.Field name="isActive">
            {(field) => (
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium text-white/90"
                  >
                    Active Status{" "}
                    {isSuperAdmin && (
                      <span className="text-xs text-amber-400">
                        (Protected)
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-white/60">
                    {isSuperAdmin
                      ? "Super Admin account is always active"
                      : field.state.value
                        ? "User can log in and access the system"
                        : "User account is disabled"}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                  disabled={isSuperAdmin}
                />
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
              {form.state.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
