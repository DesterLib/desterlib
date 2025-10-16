import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SettingGroup } from "@/components/settings/setting-group";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { UserDeleteDialog } from "@/components/settings/user-delete-dialog";
import { userSettingsConfig } from "@/config/user-settings-config";
import { useUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
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
  const [operationStatus, setOperationStatus] = useState<{
    type: string;
    message: string;
    status: "loading" | "success" | "error";
  } | null>(null);

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
    // For now, we'll show a message. In production, you'd want a full user creation dialog
    setOperationStatus({
      type: "create",
      message:
        "User creation from admin panel coming soon. Use the registration page.",
      status: "error",
    });
    setTimeout(() => setOperationStatus(null), 5000);
  };

  // Handle update user form submission
  const handleUpdateUser = async (input: PutApiV1UsersUserIdBody) => {
    if (!editingUser || !editingUser.id) return;

    setOperationStatus({
      type: "update",
      message: `Updating user ${editingUser.username}...`,
      status: "loading",
    });

    try {
      await updateUser.mutateAsync({ userId: editingUser.id, input });
      setOperationStatus({
        type: "update",
        message: "User updated successfully",
        status: "success",
      });
      setEditingUser(null);
    } catch (error) {
      setOperationStatus({
        type: "update",
        message: `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
      });
    } finally {
      setTimeout(() => setOperationStatus(null), 5000);
    }
  };

  // Handle delete user confirmation
  const handleConfirmDelete = async () => {
    if (!deletingUser || !deletingUser.id) return;

    setOperationStatus({
      type: "delete",
      message: `Deleting user ${deletingUser.username}...`,
      status: "loading",
    });

    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setOperationStatus({
        type: "delete",
        message: "User deleted successfully",
        status: "success",
      });
      setDeletingUser(null);
    } catch (error) {
      setOperationStatus({
        type: "delete",
        message: `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
      });
    } finally {
      setTimeout(() => setOperationStatus(null), 5000);
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
          {/* Operation Status */}
          {operationStatus && (
            <div className="mb-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                {operationStatus.status === "loading" && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {operationStatus.message}
                      </p>
                    </div>
                  </>
                )}
                {operationStatus.status === "success" && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white">
                      {operationStatus.message}
                    </p>
                  </>
                )}
                {operationStatus.status === "error" && (
                  <>
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white">
                      {operationStatus.message}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Render setting groups */}
          {config.groups.map((group) => (
            <SettingGroup key={group.id} group={group} />
          ))}
        </div>

        {/* Bottom Gradient Mask */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
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
