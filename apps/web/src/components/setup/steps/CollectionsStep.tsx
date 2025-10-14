import { useState } from "react";
import {
  useSetupStore,
  validateCollection,
  type CollectionConfig,
} from "@/lib/stores/setup";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Folder,
  Film,
  Tv,
  Music,
  BookOpen,
} from "lucide-react";

const LIBRARY_TYPE_ICONS = {
  movie: Film,
  tv: Tv,
  music: Music,
  comic: BookOpen,
};

const LIBRARY_TYPE_LABELS = {
  movie: "Movies",
  tv: "TV Shows",
  music: "Music",
  comic: "Comics",
};

export function CollectionsStep() {
  const {
    collections,
    addCollection,
    updateCollection,
    removeCollection,
    previousStep,
    nextStep,
    totalSteps,
  } = useSetupStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCollection, setNewCollection] = useState<Partial<CollectionConfig>>(
    {
      name: "",
      description: "",
      libraryPath: "",
      libraryType: "movie",
      isLibrary: true,
    }
  );

  const handleAddCollection = () => {
    const errors = validateCollection(newCollection as CollectionConfig);
    if (Object.keys(errors).length > 0) {
      // Show errors (you could implement error display here)
      return;
    }

    addCollection(newCollection as CollectionConfig);
    setNewCollection({
      name: "",
      description: "",
      libraryPath: "",
      libraryType: "movie",
      isLibrary: true,
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="text-sm text-gray-500">Step 3 of {totalSteps}</div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Folder className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Media Collections
            </h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            Configure your media collections. Each collection represents a
            folder containing your media files.
          </p>
        </div>

        {/* Collections List */}
        <div className="space-y-4">
          {collections.map((collection, index) => {
            const IconComponent =
              LIBRARY_TYPE_ICONS[
                collection.libraryType as keyof typeof LIBRARY_TYPE_ICONS
              ];

            return (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {collection.name}
                        </h3>
                        {collection.description && (
                          <p className="text-sm text-gray-600">
                            {collection.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Library Path
                          </label>
                          <input
                            type="text"
                            value={collection.libraryPath}
                            onChange={(e) =>
                              updateCollection(index, {
                                libraryPath: e.target.value,
                              })
                            }
                            placeholder="/path/to/your/media"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Media Type
                          </label>
                          <select
                            value={collection.libraryType}
                            onChange={(e) =>
                              updateCollection(index, {
                                libraryType: e.target.value as
                                  | "movie"
                                  | "tv"
                                  | "music"
                                  | "comic",
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          >
                            {Object.entries(LIBRARY_TYPE_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={collection.name}
                            onChange={(e) =>
                              updateCollection(index, { name: e.target.value })
                            }
                            placeholder="Collection name"
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          />
                        </div>

                        {collections.length > 1 && (
                          <button
                            onClick={() => removeCollection(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Collection Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="ghost"
            className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-teal-500 hover:text-teal-600 rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Collection
          </Button>
        )}

        {/* Add Collection Form */}
        {showAddForm && (
          <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
            <h3 className="font-semibold text-teal-900 mb-4">
              Add New Collection
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={newCollection.name || ""}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Anime, Documentaries"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Media Type
                  </label>
                  <select
                    value={newCollection.libraryType || "movie"}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        libraryType: e.target.value as
                          | "movie"
                          | "tv"
                          | "music"
                          | "comic",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  >
                    {Object.entries(LIBRARY_TYPE_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Library Path
                </label>
                <input
                  type="text"
                  value={newCollection.libraryPath || ""}
                  onChange={(e) =>
                    setNewCollection({
                      ...newCollection,
                      libraryPath: e.target.value,
                    })
                  }
                  placeholder="/path/to/your/media"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newCollection.description || ""}
                  onChange={(e) =>
                    setNewCollection({
                      ...newCollection,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of this collection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="ghost"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCollection}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2"
              >
                Add Collection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={previousStep}
          variant="ghost"
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <Button
          onClick={nextStep}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-medium flex items-center space-x-2"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
