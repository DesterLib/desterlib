import type { SettingsPageConfig } from "@/config/settings-config";
import type { GetApiV1Users200 } from "@dester/api-client";
import { UserPlus, Edit, Trash2 } from "lucide-react";

interface UserSettingsConfigParams {
  usersData?: GetApiV1Users200 | null;
  onCreateUser: () => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

/**
 * Generate user management settings configuration based on actual data
 */
export function userSettingsConfig({
  usersData,
  onCreateUser,
  onEditUser,
  onDeleteUser,
}: UserSettingsConfigParams): SettingsPageConfig {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "⭐";
      case "ADMIN":
        return "👑";
      case "USER":
        return "👤";
      case "GUEST":
        return "👥";
      default:
        return "❓";
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-500/20";
      case "ADMIN":
        return "bg-purple-500/20";
      case "USER":
        return "bg-blue-500/20";
      case "GUEST":
        return "bg-gray-500/20";
      default:
        return "bg-white/10";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-400";
      case "ADMIN":
        return "bg-purple-400";
      case "USER":
        return "bg-blue-400";
      case "GUEST":
        return "bg-gray-400";
      default:
        return "bg-white/40";
    }
  };

  return {
    title: "User Management",
    description: "Manage users, roles, and permissions",
    groups: [
      // Users List
      {
        id: "users-list",
        title: "Users",
        description: `${usersData?.pagination?.total ?? 0} total users`,
        headerAction: {
          label: "Add User",
          icon: UserPlus,
          variant: "default",
          onClick: onCreateUser,
        },
        items:
          usersData && usersData.users && usersData.users.length > 0
            ? usersData.users.map((user) => ({
                id: `user-${user.id}`,
                label: user.displayName || user.username || "Unknown",
                description: `${user.username || "N/A"}${user.email ? ` • ${user.email}` : ""} • Last login: ${formatDate(user.lastLoginAt || null)}`,
                icon: getRoleIcon(user.role || "USER"),
                iconBgColor: getRoleBgColor(user.role || "USER"),
                status: user.role || "USER",
                statusColor: getRoleColor(user.role || "USER"),
                actions: [
                  {
                    label:
                      user.role === "SUPER_ADMIN"
                        ? "Edit Profile (Limited)"
                        : "Edit User",
                    icon: Edit,
                    variant: "ghost" as const,
                    onClick: () => onEditUser(user.id || ""),
                  },
                  {
                    label: "Delete User",
                    icon: Trash2,
                    variant: "danger" as const,
                    onClick: () => onDeleteUser(user.id || ""),
                    disabled:
                      user.role === "SUPER_ADMIN" || user.role === "ADMIN", // Prevent deleting super admin and admin users
                  },
                ],
              }))
            : [
                {
                  id: "no-users",
                  label: "No users found",
                  description:
                    "Click 'Add User' above to create your first user",
                  icon: "👥",
                  iconBgColor: "bg-white/5",
                },
              ],
      },

      // User Statistics
      {
        id: "user-stats",
        title: "User Statistics",
        description: "Overview of user roles and status",
        items:
          usersData && usersData.users
            ? [
                {
                  id: "super-admin-count",
                  label: "Super Administrators",
                  description: "Protected first user with unrestricted access",
                  icon: "⭐",
                  iconBgColor: "bg-amber-500/20",
                  value: usersData.users
                    .filter((u) => u.role === "SUPER_ADMIN")
                    .length.toString(),
                  type: "display" as const,
                },
                {
                  id: "admin-count",
                  label: "Administrators",
                  description: "Users with full system access",
                  icon: "👑",
                  iconBgColor: "bg-purple-500/20",
                  value: usersData.users
                    .filter((u) => u.role === "ADMIN")
                    .length.toString(),
                  type: "display" as const,
                },
                {
                  id: "user-count",
                  label: "Regular Users",
                  description: "Standard user accounts",
                  icon: "👤",
                  iconBgColor: "bg-blue-500/20",
                  value: usersData.users
                    .filter((u) => u.role === "USER")
                    .length.toString(),
                  type: "display" as const,
                },
                {
                  id: "guest-count",
                  label: "Guest Users",
                  description: "Limited access accounts",
                  icon: "👥",
                  iconBgColor: "bg-gray-500/20",
                  value: usersData.users
                    .filter((u) => u.role === "GUEST")
                    .length.toString(),
                  type: "display" as const,
                },
                {
                  id: "active-count",
                  label: "Active Users",
                  description: "Users with active accounts",
                  icon: "✅",
                  iconBgColor: "bg-green-500/20",
                  value: usersData.users
                    .filter((u) => u.isActive)
                    .length.toString(),
                  type: "display" as const,
                },
                {
                  id: "locked-count",
                  label: "Locked Users",
                  description: "Users with locked accounts",
                  icon: "🔒",
                  iconBgColor: "bg-red-500/20",
                  value: usersData.users
                    .filter((u) => u.isLocked)
                    .length.toString(),
                  type: "display" as const,
                },
              ]
            : [],
      },
    ],
  };
}
