import type { SettingsPageConfig } from "@/config/settings-config";
import type { Collection, Settings } from "@dester/api-client";
import {
  Plus,
  Pencil,
  Trash2,
  FolderSync,
  Settings as SettingsIcon,
  Trash,
} from "lucide-react";

interface LibrariesSettingsConfigParams {
  libraries: Collection[];
  settings?: Settings;
  onAddLibrary: () => void;
  onEditLibrary: (library: Collection) => void;
  onDeleteLibrary: (library: Collection) => void;
  onScanLibrary: (library: Collection) => void;
  onUpdateSetting: (key: string, value: unknown) => void;
  onConfigureTmdb: () => void;
  onCleanupOrphaned: () => void;
}

/**
 * Generate library settings configuration based on actual data
 */
export function librariesSettingsConfig({
  libraries,
  settings,
  onAddLibrary,
  onEditLibrary,
  onDeleteLibrary,
  onScanLibrary,
  onConfigureTmdb,
  onCleanupOrphaned,
}: LibrariesSettingsConfigParams): SettingsPageConfig {
  // Helper to get emoji and color based on media type
  const getLibraryIconInfo = (type?: string) => {
    switch (type) {
      case "MOVIE":
        return { icon: "🎬", bgColor: "bg-blue-500/20" };
      case "TV_SHOW":
        return { icon: "📺", bgColor: "bg-purple-500/20" };
      case "MUSIC":
        return { icon: "🎵", bgColor: "bg-green-500/20" };
      case "COMIC":
        return { icon: "📚", bgColor: "bg-orange-500/20" };
      default:
        return { icon: "📁", bgColor: "bg-gray-500/20" };
    }
  };

  // Helper to format media type for display
  const formatMediaType = (type?: string) => {
    if (!type) return "";
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return {
    title: "Libraries",
    description: "Manage your media libraries and collections",
    groups: [
      ...(libraries.length > 0
        ? [
            {
              id: "bulk-operations",
              title: "Bulk Operations",
              items: [
                {
                  id: "scan-all-libraries",
                  label: "Scan All Libraries",
                  description: "Scan all libraries for new or modified files",
                  icon: "🔄",
                  iconBgColor: "bg-indigo-500/20",
                  actions: [
                    {
                      label: "Scan All",
                      icon: FolderSync,
                      variant: "modification" as const,
                      onClick: () => {
                        libraries.forEach((lib) => onScanLibrary(lib));
                      },
                    },
                  ],
                },
              ],
            },
          ]
        : []),
      {
        id: "library-management",
        title: "Library Management",
        headerAction: {
          label: "Add Library",
          icon: Plus,
          variant: "default",
          onClick: onAddLibrary,
        },
        items:
          libraries.length > 0
            ? libraries.map((library) => {
                const { icon, bgColor } = getLibraryIconInfo(
                  library.libraryType
                );

                return {
                  id: `library-${library.id}`,
                  label: library.name || "Unnamed Library",
                  description: library.libraryPath || "No path configured",
                  icon,
                  iconBgColor: bgColor,
                  status: library.libraryType
                    ? formatMediaType(library.libraryType)
                    : undefined,
                  actions: [
                    {
                      label: "Scan",
                      icon: FolderSync,
                      variant: "modification" as const,
                      onClick: () => onScanLibrary(library),
                    },
                    {
                      label: "Edit",
                      icon: Pencil,
                      variant: "modification" as const,
                      onClick: () => onEditLibrary(library),
                    },
                    {
                      label: "Remove",
                      icon: Trash2,
                      variant: "danger" as const,
                      onClick: () => onDeleteLibrary(library),
                    },
                  ],
                };
              })
            : [
                {
                  id: "no-libraries",
                  label: "No libraries found",
                  description:
                    "Click 'Add Library' above to configure your first media library",
                  icon: "📚",
                  iconBgColor: "bg-white/5",
                },
              ],
      },
      {
        id: "metadata-apis",
        title: "Metadata & External APIs",
        items: [
          {
            id: "tmdb-api-key",
            label: "TMDB API Key",
            description: "The Movie Database API key for metadata",
            status: settings?.tmdbApiKey ? "Configured" : "Not Configured",
            statusColor: settings?.tmdbApiKey
              ? "bg-green-400"
              : "bg-yellow-400",
            value: settings?.tmdbApiKey
              ? `${settings.tmdbApiKey.slice(0, 8)}...`
              : undefined,
            actions: [
              {
                label: settings?.tmdbApiKey ? "Update" : "Configure",
                icon: SettingsIcon,
                variant: "modification" as const,
                onClick: onConfigureTmdb,
              },
            ],
          },
        ],
      },
      {
        id: "maintenance",
        title: "Maintenance",
        items: [
          {
            id: "cleanup-orphaned-media",
            label: "Clean Up Orphaned Media",
            description:
              "Remove media items that are no longer associated with any library",
            icon: "🧹",
            iconBgColor: "bg-red-500/20",
            actions: [
              {
                label: "Clean Up",
                icon: Trash,
                variant: "danger" as const,
                onClick: onCleanupOrphaned,
              },
            ],
          },
        ],
      },
    ],
  };
}
