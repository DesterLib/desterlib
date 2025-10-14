import { useSetupStore } from "@/lib/stores/setup";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Key, Folder } from "lucide-react";

export function ReviewStep() {
  const { tmdbKey, collections, previousStep, nextStep, totalSteps } =
    useSetupStore();

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="text-sm text-gray-500">Step 4 of {totalSteps}</div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Review Configuration
            </h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            Please review your configuration before proceeding. You can go back
            to make changes if needed.
          </p>
        </div>

        {/* Configuration Summary */}
        <div className="space-y-6">
          {/* TMDB Configuration */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  TMDB Configuration
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      API Key:{" "}
                      {tmdbKey.apiKey
                        ? "••••••••" + tmdbKey.apiKey.slice(-4)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Metadata fetching enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collections Configuration */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Media Collections
                </h3>
                <div className="space-y-4">
                  {collections.map((collection, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {collection.name}
                          </h4>
                          {collection.description && (
                            <p className="text-sm text-gray-600">
                              {collection.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {collection.libraryType}
                          </div>
                          <div className="text-xs text-gray-500">
                            {collection.isLibrary ? "Library" : "Collection"}
                          </div>
                        </div>
                      </div>
                      {collection.libraryPath && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Path:</span>{" "}
                          {collection.libraryPath}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Info */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ</div>
            <div className="space-y-2">
              <p className="text-blue-800 font-medium">What happens next?</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Your TMDB API key will be saved and validated</li>
                <li>• Media collections will be created and configured</li>
                <li>• You'll be ready to start adding media to your library</li>
              </ul>
            </div>
          </div>
        </div>
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
          <span>Complete Setup</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
