import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SettingGroup } from "@/components/settings/setting-group";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { UserDeleteDialog } from "@/components/settings/user-delete-dialog";
import { userSettingsConfig } from "@/config/user-settings-config";
import { useUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, XCircle } from "lucide-react";
import type {
  GetApiV1Users200UsersItem,
  PutApiV1UsersUserIdBody,
} from "@dester/api-client";
import { requireAdmin } from "@/lib/route-guards";

export const Route = createFileRoute("/settings/users")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require admin role (ADMIN or SUPER_ADMIN) - redirects to login if not authenticated
    await requireAdmin();
  },
});

function RouteComponent() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers();

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editingUser, setEditingUser] =
    useState<GetApiV1Users200UsersItem | null>(null);
  const [deletingUser, setDeletingUser] =
    useState<GetApiV1Users200UsersItem | null>(null);

  // Handle editing a user
  const handleEditUser = (userId: string) => {
    const user = usersData?.users?.find((u) => u.id === userId);
    if (user) {
      setEditingUser(user);
    }
  };

  // Handle deleting a user
  const handleDeleteUser = (userId: string) => {
    const user = usersData?.users?.find((u) => u.id === userId);
    if (user) {
      setDeletingUser(user);
    }
  };

  // Handle user creation (redirect to register page for now)
  const handleCreateUser = () => {
    toast.info("Coming soon", {
      description:
        "User creation from admin panel coming soon. Use the registration page.",
    });
  };

  // Handle update user form submission
  const handleUpdateUser = async (input: PutApiV1UsersUserIdBody) => {
    if (!editingUser || !editingUser.id) return;

    try {
      await updateUser.mutateAsync({ userId: editingUser.id, input });
      toast.success("User updated", {
        description: editingUser.username,
      });
      setEditingUser(null);
    } catch (error) {
      toast.error("Failed to update user", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Handle delete user confirmation
  const handleConfirmDelete = async () => {
    if (!deletingUser || !deletingUser.id) return;

    try {
      await deleteUser.mutateAsync(deletingUser.id);
      toast.success("User deleted", {
        description: deletingUser.username,
      });
      setDeletingUser(null);
    } catch (error) {
      toast.error("Failed to delete user", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Generate the config dynamically with real data
  const config = userSettingsConfig({
    usersData,
    onCreateUser: handleCreateUser,
    onEditUser: handleEditUser,
    onDeleteUser: handleDeleteUser,
  });

  // Show loading state while checking auth or loading users
  if (isAuthLoading || isLoadingUsers) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto" />
          <p className="text-sm text-white/60">
            {isAuthLoading ? "Checking authentication..." : "Loading users..."}
          </p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Admin Access Required
          </h2>
          <p className="text-white/60">
            This page is only accessible to administrators. Please contact your
            system administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  // Show error state if users failed to load
  if (usersError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Failed to Load Users
          </h2>
          <p className="text-white/60">
            {usersError instanceof Error
              ? usersError.message
              : "An error occurred while fetching users. Please try refreshing the page."}
          </p>
          <p className="text-xs text-white/40 font-mono mt-2">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-full md:py-4">
      {/* Fixed Header */}
      <header className="space-y-1 pb-4 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold">{config.title}</h1>
        <p className="text-xs md:text-sm text-white/60">{config.description}</p>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 md:overflow-y-auto space-y-6">
        {/* Render setting groups */}
        {config.groups.map((group) => (
          <SettingGroup key={group.id} group={group} />
        ))}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <UserFormDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSubmit={handleUpdateUser}
          user={editingUser}
        />
      )}

      {/* Delete User Dialog */}
      {deletingUser && (
        <UserDeleteDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
          user={deletingUser}
          isDeleting={deleteUser.isPending}
        />
      )}
    </div>
  );
}
