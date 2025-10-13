import { useState, useEffect } from "preact/hooks";
import { Animated } from "../../animation";
import { api, type Collection } from "../../api/client";
import type { NotificationType } from "../notifications/notification_center";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ScanFormData {
  path: string;
  mediaType: "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC";
  collectionName: string;
  updateExisting: boolean;
}

interface SettingsProps {
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string
  ) => void;
}

type SettingsTab = "collections" | "preferences";

export default function Settings({ addNotification }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [updatingMetadataId, setUpdatingMetadataId] = useState<string | null>(
    null
  );
  const [updateProgress, setUpdateProgress] = useState<{
    current: number;
    total: number;
    collectionId: string;
  } | null>(null);

  // Parsing preference: auto (filename first, fallback to directory), filename, or directory
  const [parsingMethod, setParsingMethod] = useState<
    "auto" | "filename" | "directory"
  >(() => {
    const saved = localStorage.getItem("tvshow-parsing-method");
    return (saved as "auto" | "filename" | "directory") || "auto";
  });

  const [formData, setFormData] = useState<ScanFormData>({
    path: "",
    mediaType: "MOVIE",
    collectionName: "",
    updateExisting: false,
  });

  // Save parsing preference to localStorage and notify
  useEffect(() => {
    const previousMethod = localStorage.getItem("tvshow-parsing-method");
    localStorage.setItem("tvshow-parsing-method", parsingMethod);

    // Only show notification if it's a change (not on initial load)
    if (previousMethod && previousMethod !== parsingMethod) {
      const methodName =
        parsingMethod === "auto"
          ? "Auto (Filename first, fallback to directory)"
          : parsingMethod === "filename"
            ? "Filename only"
            : "Directory structure only";

      addNotification(
        "success",
        "Parsing Method Updated",
        `Now using: ${methodName}`
      );
    }
  }, [parsingMethod, addNotification]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);

    try {
      const response = await api.collections.getAll();

      if (response.success && response.data) {
        setCollections(response.data.collections);
      } else if (!response.success) {
        addNotification(
          "error",
          "Failed to Load Collections",
          response.error.message
        );
      }
    } catch (err) {
      addNotification(
        "error",
        "Failed to Load Collections",
        err instanceof Error ? err.message : "An error occurred"
      );
    }

    setLoading(false);
  };

  const handleAddCollection = async (e: Event) => {
    e.preventDefault();
    setScanLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        addNotification(
          "success",
          "Collection Added",
          data.data.message || "Collection added successfully"
        );
        setShowAddForm(false);
        setFormData({
          path: "",
          mediaType: "MOVIE",
          collectionName: "",
          updateExisting: false,
        });
        fetchCollections();
      } else {
        addNotification(
          "error",
          "Failed to Add Collection",
          data.error?.message || "An error occurred"
        );
      }
    } catch (err) {
      addNotification(
        "error",
        "Failed to Add Collection",
        err instanceof Error ? err.message : "An error occurred"
      );
    }

    setScanLoading(false);
  };

  const handleSyncCollection = async (collectionName: string, id: string) => {
    setSyncingId(id);

    try {
      // Find the collection to get its media type
      const collection = collections.find((c) => c.id === id);
      if (!collection || !collection.recentMedia.length) {
        addNotification("error", "Cannot Sync", "Collection has no media");
        setSyncingId(null);
        return;
      }

      const mediaType = collection.recentMedia[0].type;

      const response = await fetch(`${API_BASE_URL}/api/scan/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionName, mediaType }),
      });

      const data = await response.json();

      if (data.success) {
        const originalMessage = data.data.message || "";
        const message =
          originalMessage || "Collection paths validated successfully";

        addNotification("success", "Path Validation Complete", message);
        fetchCollections();
      } else {
        addNotification(
          "error",
          "Sync Failed",
          data.error?.message || "Failed to sync collection paths"
        );
      }
    } catch (err) {
      addNotification(
        "error",
        "Sync Failed",
        err instanceof Error ? err.message : "An error occurred"
      );
    }

    setSyncingId(null);
  };

  const handleSyncAll = async () => {
    setSyncingId("all");

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/sync-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Show more descriptive message about what sync does
        const originalMessage = data.data.message || "";
        const message =
          originalMessage || "All collection paths validated successfully";

        addNotification("success", "All Paths Validated", message);
        fetchCollections();
      } else {
        addNotification(
          "error",
          "Validation Failed",
          data.error?.message || "Failed to sync collection paths"
        );
      }
    } catch (err) {
      addNotification(
        "error",
        "Validation Failed",
        err instanceof Error ? err.message : "An error occurred"
      );
    }

    setSyncingId(null);
  };

  const handleUpdateMetadata = async (collectionName: string, id: string) => {
    setUpdatingMetadataId(id);

    try {
      // Find the collection to get its details
      const collection = collections.find((c) => c.id === id);
      if (!collection || !collection.recentMedia.length) {
        addNotification("error", "Cannot Update", "Collection has no media");
        setUpdatingMetadataId(null);
        return;
      }

      // Set initial progress
      const totalItems = collection.mediaCount;
      setUpdateProgress({
        current: 0,
        total: totalItems,
        collectionId: id,
      });

      // Get the collection details to find the base path
      const collectionResponse = await api.collections.getById(id);
      if (!collectionResponse.success || !collectionResponse.data) {
        addNotification(
          "error",
          "Update Failed",
          "Failed to get collection details"
        );
        setUpdatingMetadataId(null);
        setUpdateProgress(null);
        return;
      }

      const fullCollection = collectionResponse.data.collection;

      // Extract base path from the first media file
      let basePath = "";
      if (fullCollection.media && fullCollection.media.length > 0) {
        const firstMedia = fullCollection.media[0];
        const filePath =
          firstMedia.movie?.filePath ||
          firstMedia.tvShow?.seasons?.[0]?.episodes?.[0]?.filePath ||
          firstMedia.music?.filePath ||
          firstMedia.comic?.filePath;

        if (filePath) {
          const pathParts = filePath.split("/");

          // For TV shows, we need to go back to the show root folder
          // Structure: /path/to/Show Name {tmdb-id}/Season 01/Episode.mkv
          // We want: /path/to/Show Name {tmdb-id}
          if (firstMedia.tvShow) {
            // Remove filename
            pathParts.pop();
            // Remove season folder (e.g., "Season 01")
            if (
              pathParts.length > 0 &&
              pathParts[pathParts.length - 1]?.match(/^Season\s+\d+$/i)
            ) {
              pathParts.pop();
            }
            basePath = pathParts.join("/");
          } else {
            // For movies/music/comics, just remove the filename
            pathParts.pop();
            basePath = pathParts.join("/");
          }
        }
      }

      if (!basePath) {
        addNotification(
          "error",
          "Update Failed",
          "Cannot determine collection path"
        );
        setUpdatingMetadataId(null);
        setUpdateProgress(null);
        return;
      }

      const mediaType = collection.recentMedia[0].type;

      // Simulate progress (since we don't have real-time updates from the API)
      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => {
          if (!prev || prev.current >= prev.total) return prev;
          return {
            ...prev,
            current: Math.min(prev.current + 1, prev.total),
          };
        });
      }, 500); // Update every 500ms

      // Rescan with updateExisting to update metadata
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: basePath,
          mediaType,
          collectionName,
          updateExisting: true,
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (data.success) {
        // Set progress to complete
        setUpdateProgress({
          current: totalItems,
          total: totalItems,
          collectionId: id,
        });

        // Show success message based on actual results
        const stats = data.data.scan?.stats;
        let message = "Metadata updated successfully";

        if (stats) {
          const parts = [];
          if (stats.updated > 0) parts.push(`${stats.updated} updated`);
          if (stats.added > 0) parts.push(`${stats.added} added`);
          if (stats.skipped > 0) parts.push(`${stats.skipped} unchanged`);

          if (parts.length > 0) {
            message = parts.join(", ");
          }
        }

        addNotification("success", "Metadata Update Complete", message);

        // Clear progress after a short delay
        setTimeout(() => setUpdateProgress(null), 2000);

        fetchCollections();
      } else {
        addNotification(
          "error",
          "Update Failed",
          data.error?.message || "Failed to update metadata"
        );
        setUpdateProgress(null);
      }
    } catch (err) {
      addNotification(
        "error",
        "Update Failed",
        err instanceof Error ? err.message : "An error occurred"
      );
      setUpdateProgress(null);
    }

    setUpdatingMetadataId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Animated show={true} preset="fade" duration={300}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white/80 mb-4"></div>
            <p className="text-white/60 text-lg">Loading settings...</p>
          </div>
        </Animated>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-12">
      <Animated show={true} preset="fade" duration={500}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl font-semibold mb-2">Settings</h1>
            <p className="text-white/60">
              Manage your media library and preferences
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab("collections")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "collections"
                  ? "text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Collections
              {activeTab === "collections" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "preferences"
                  ? "text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Preferences
              {activeTab === "preferences" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>

          {/* Collections Tab */}
          {activeTab === "collections" && (
            <div>
              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-[50px] transition-colors font-medium"
                >
                  {showAddForm ? "Cancel" : "Add Collection"}
                </button>
                <button
                  onClick={handleSyncAll}
                  disabled={syncingId === "all" || collections.length === 0}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-[50px] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingId === "all"
                    ? "Validating Paths..."
                    : "Validate All Paths"}
                </button>
              </div>

              {/* Add Collection Form */}
              {showAddForm && (
                <Animated show={true} preset="slideDown" duration={300}>
                  <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-lg">
                    <h2 className="text-white text-xl font-semibold mb-4">
                      Add New Collection
                    </h2>
                    <form onSubmit={handleAddCollection} className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Directory Path
                        </label>
                        <input
                          type="text"
                          value={formData.path}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              path: (e.target as HTMLInputElement).value,
                            })
                          }
                          placeholder="/path/to/your/media"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Collection Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.collectionName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              collectionName: (e.target as HTMLInputElement)
                                .value,
                            })
                          }
                          placeholder="Leave empty to use folder name"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Media Type
                        </label>
                        <select
                          value={formData.mediaType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mediaType: (e.target as HTMLSelectElement)
                                .value as ScanFormData["mediaType"],
                            })
                          }
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                        >
                          <option value="MOVIE">Movies</option>
                          <option value="TV_SHOW">TV Shows</option>
                          <option value="MUSIC">Music</option>
                          <option value="COMIC">Comics</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="updateExisting"
                          checked={formData.updateExisting}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              updateExisting: (e.target as HTMLInputElement)
                                .checked,
                            })
                          }
                          className="w-5 h-5 bg-white/10 border border-white/20 rounded cursor-pointer"
                        />
                        <label
                          htmlFor="updateExisting"
                          className="text-white/80 text-sm cursor-pointer"
                        >
                          Update existing entries
                        </label>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={scanLoading}
                          className="px-6 py-3 bg-white text-black rounded-[50px] hover:bg-white/90 active:bg-white/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {scanLoading ? "Scanning..." : "Scan & Add"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-[50px] transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </Animated>
              )}

              {/* Collections List */}
              <div className="space-y-4">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Collections ({collections.length})
                </h2>

                {collections.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-white/40 text-5xl mb-3">📚</div>
                    <h3 className="text-white text-lg font-semibold mb-2">
                      No collections yet
                    </h3>
                    <p className="text-white/60 text-sm">
                      Add your first collection to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="p-5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/[0.07] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white text-lg font-semibold mb-1">
                              {collection.name}
                            </h3>
                            {collection.description && (
                              <p className="text-white/60 text-sm mb-2">
                                {collection.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-white/50">
                              <span>{collection.mediaCount} items</span>
                              <span>•</span>
                              <span>
                                Updated{" "}
                                {new Date(
                                  collection.updatedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            {updateProgress &&
                              updateProgress.collectionId === collection.id && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-white/60">
                                      Updating metadata...
                                    </span>
                                    <span className="text-xs text-white/60">
                                      {updateProgress.current} /{" "}
                                      {updateProgress.total}
                                    </span>
                                  </div>
                                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-white h-full rounded-full transition-all duration-300"
                                      style={{
                                        width: `${
                                          (updateProgress.current /
                                            updateProgress.total) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                handleSyncCollection(
                                  collection.name,
                                  collection.id
                                )
                              }
                              disabled={
                                syncingId === collection.id ||
                                updatingMetadataId === collection.id
                              }
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-sm rounded-[50px] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {syncingId === collection.id
                                ? "Validating..."
                                : "Validate Paths"}
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateMetadata(
                                  collection.name,
                                  collection.id
                                )
                              }
                              disabled={
                                syncingId === collection.id ||
                                updatingMetadataId === collection.id
                              }
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-sm rounded-[50px] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {updatingMetadataId === collection.id
                                ? "Updating..."
                                : "Update Metadata"}
                            </button>
                            <button
                              disabled
                              className="px-4 py-2 bg-red-500/10 text-red-400/50 text-sm rounded-[50px] cursor-not-allowed font-medium whitespace-nowrap"
                              title="Delete functionality not yet implemented"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div>
              {/* TV Show Parsing Method */}
              <div className="mb-8">
                <h2 className="text-white text-xl font-semibold mb-2">
                  TV Show Parsing Method
                </h2>
                <p className="text-white/60 text-sm mb-4">
                  Choose how the system extracts show names from your TV show
                  files
                </p>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      parsingMethod === "auto"
                        ? "bg-white border-white shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="parsing-method"
                      value="auto"
                      checked={parsingMethod === "auto"}
                      onChange={(e) =>
                        setParsingMethod(
                          (e.target as HTMLInputElement)
                            .value as typeof parsingMethod
                        )
                      }
                      className={`w-4 h-4 cursor-pointer ${
                        parsingMethod === "auto"
                          ? "accent-black"
                          : "accent-white"
                      }`}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          parsingMethod === "auto"
                            ? "text-black"
                            : "text-white/80"
                        }`}
                      >
                        Auto (Recommended)
                      </div>
                      <div
                        className={`text-sm ${
                          parsingMethod === "auto"
                            ? "text-black/70"
                            : "text-white/50"
                        }`}
                      >
                        Try filename first (e.g., "Show Name - S01E01"),
                        fallback to directory structure
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      parsingMethod === "filename"
                        ? "bg-white border-white shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="parsing-method"
                      value="filename"
                      checked={parsingMethod === "filename"}
                      onChange={(e) =>
                        setParsingMethod(
                          (e.target as HTMLInputElement)
                            .value as typeof parsingMethod
                        )
                      }
                      className={`w-4 h-4 cursor-pointer ${
                        parsingMethod === "filename"
                          ? "accent-black"
                          : "accent-white"
                      }`}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          parsingMethod === "filename"
                            ? "text-black"
                            : "text-white/80"
                        }`}
                      >
                        Filename Only
                      </div>
                      <div
                        className={`text-sm ${
                          parsingMethod === "filename"
                            ? "text-black/70"
                            : "text-white/50"
                        }`}
                      >
                        Extract show name only from filename (e.g., "Show Name -
                        S01E01 - Episode Title.mkv")
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      parsingMethod === "directory"
                        ? "bg-white border-white shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="parsing-method"
                      value="directory"
                      checked={parsingMethod === "directory"}
                      onChange={(e) =>
                        setParsingMethod(
                          (e.target as HTMLInputElement)
                            .value as typeof parsingMethod
                        )
                      }
                      className={`w-4 h-4 cursor-pointer ${
                        parsingMethod === "directory"
                          ? "accent-black"
                          : "accent-white"
                      }`}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          parsingMethod === "directory"
                            ? "text-black"
                            : "text-white/80"
                        }`}
                      >
                        Directory Structure
                      </div>
                      <div
                        className={`text-sm ${
                          parsingMethod === "directory"
                            ? "text-black/70"
                            : "text-white/50"
                        }`}
                      >
                        Extract show name only from parent folder (e.g., "/Show
                        Name/Season 01/episode.mkv")
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Preferences Section - Placeholder for future settings */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                <h2 className="text-white text-xl font-semibold mb-2">
                  General Settings
                </h2>
                <p className="text-white/60 text-sm">
                  More settings coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </Animated>
    </div>
  );
}
