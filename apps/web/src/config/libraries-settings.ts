import type { SettingsPageConfig } from "@/lib/settings-config";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Settings,
  FolderSync,
} from "lucide-react";

export const librariesSettingsConfig: SettingsPageConfig = {
  title: "Libraries",
  description: "Manage your media libraries and collections",
  groups: [
    {
      id: "library-management",
      title: "Library Management",
      headerAction: {
        label: "Add Library",
        icon: Plus,
        variant: "default",
        onClick: () => console.log("Add Library"),
      },
      items: [
        {
          id: "library-movies",
          label: "Movies",
          description: "/media/movies",
          icon: "🎬",
          iconBgColor: "bg-blue-500/20",
          status: "MOVIE",
          actions: [
            {
              label: "Edit",
              icon: Pencil,
              variant: "modification",
              onClick: () => console.log("Edit Movies"),
            },
            {
              label: "Remove",
              icon: Trash2,
              variant: "danger",
              onClick: () => console.log("Remove Movies"),
            },
          ],
        },
        {
          id: "library-tv",
          label: "TV Shows",
          description: "/media/tv",
          icon: "📺",
          iconBgColor: "bg-purple-500/20",
          status: "TV_SHOW",
          actions: [
            {
              label: "Edit",
              icon: Pencil,
              variant: "modification",
              onClick: () => console.log("Edit TV Shows"),
            },
            {
              label: "Remove",
              icon: Trash2,
              variant: "danger",
              onClick: () => console.log("Remove TV Shows"),
            },
          ],
        },
        {
          id: "library-music",
          label: "Music",
          description: "/media/music",
          icon: "🎵",
          iconBgColor: "bg-green-500/20",
          status: "MUSIC",
          actions: [
            {
              label: "Edit",
              icon: Pencil,
              variant: "modification",
              onClick: () => console.log("Edit Music"),
            },
            {
              label: "Remove",
              icon: Trash2,
              variant: "danger",
              onClick: () => console.log("Remove Music"),
            },
          ],
        },
      ],
    },
    {
      id: "library-configuration",
      title: "Library Configuration",
      items: [
        {
          id: "library-name",
          label: "Library Name",
          description: "Display name for the library",
          actions: [
            {
              label: "Configure",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Configure Library Name"),
            },
          ],
        },
        {
          id: "library-path",
          label: "Library Path",
          description: "File system path to media files",
          actions: [
            {
              label: "Configure",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Configure Library Path"),
            },
          ],
        },
        {
          id: "library-type",
          label: "Library Type",
          description: "MOVIE, TV_SHOW, MUSIC, or COMIC",
          actions: [
            {
              label: "Configure",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Configure Library Type"),
            },
          ],
        },
        {
          id: "library-description",
          label: "Description",
          description: "Optional description for the library",
          actions: [
            {
              label: "Configure",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Configure Description"),
            },
          ],
        },
      ],
    },
    {
      id: "visual-assets",
      title: "Visual Assets",
      items: [
        {
          id: "poster-url",
          label: "Poster URL",
          description: "Cover image for the library",
          actions: [
            {
              label: "Upload",
              icon: Upload,
              variant: "modification",
              onClick: () => console.log("Upload Poster"),
            },
          ],
        },
        {
          id: "backdrop-url",
          label: "Backdrop URL",
          description: "Background image for the library",
          actions: [
            {
              label: "Upload",
              icon: Upload,
              variant: "modification",
              onClick: () => console.log("Upload Backdrop"),
            },
          ],
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
          status: "Configured",
          statusColor: "text-green-400",
          actions: [
            {
              label: "Update",
              icon: Pencil,
              variant: "modification",
              onClick: () => console.log("Update TMDB Key"),
            },
          ],
        },
        {
          id: "auto-fetch-metadata",
          label: "Auto-fetch Metadata",
          description: "Automatically fetch media information",
          type: "toggle",
          toggle: {
            checked: false,
            onChange: (checked) => console.log("Auto-fetch metadata:", checked),
          },
        },
      ],
    },
    {
      id: "scanning-organization",
      title: "Scanning & Organization",
      items: [
        {
          id: "scan-library",
          label: "Scan Library",
          description: "Scan for new or modified files",
          actions: [
            {
              label: "Scan Now",
              icon: FolderSync,
              variant: "modification",
              onClick: () => console.log("Scan Now"),
            },
          ],
        },
        {
          id: "auto-scan-interval",
          label: "Auto-scan Interval",
          description: "Scan library every X hours",
          type: "slider",
          slider: {
            min: 1,
            max: 24,
            step: 1,
            value: 6,
            unit: "h",
            onChange: (value) => console.log("Auto-scan interval:", value),
          },
        },
        {
          id: "nested-collections",
          label: "Nested Collections",
          description: "Organize media into sub-collections",
          actions: [
            {
              label: "Manage",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Manage Collections"),
            },
          ],
        },
      ],
    },
    {
      id: "advanced-settings",
      title: "Advanced Settings",
      items: [
        {
          id: "library-slug",
          label: "Library Slug",
          description: "URL-friendly identifier",
          value: "movies-2024",
        },
        {
          id: "parent-collection",
          label: "Parent Collection",
          description: "Assign library to a parent collection",
          actions: [
            {
              label: "Configure",
              icon: Settings,
              variant: "modification",
              onClick: () => console.log("Configure Parent Collection"),
            },
          ],
        },
        {
          id: "file-size-tracking",
          label: "File Size Tracking",
          description: "Monitor file sizes and storage usage",
          type: "toggle",
          toggle: {
            checked: true,
            onChange: (checked) => console.log("File size tracking:", checked),
          },
        },
        {
          id: "file-modified-tracking",
          label: "File Modified Tracking",
          description: "Track when files were last modified",
          type: "toggle",
          toggle: {
            checked: true,
            onChange: (checked) =>
              console.log("File modified tracking:", checked),
          },
        },
      ],
    },
  ],
};
