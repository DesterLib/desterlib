import { useState } from "react";
import { useSetupStore, validateTMDBKey } from "@/lib/stores/setup";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

export function TMDBKeyStep() {
  const {
    tmdbKey,
    updateTMDBKey,
    previousStep,
    nextStep,
    setLoading,
    setErrors,
    clearErrors,
    totalSteps,
  } = useSetupStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = (value: string) => {
    clearErrors();
    updateTMDBKey({ apiKey: value });
  };

  const validateKey = async () => {
    if (!tmdbKey.apiKey.trim()) {
      setErrors({ apiKey: ["TMDB API key is required"] });
      return;
    }

    const errors = validateTMDBKey(tmdbKey);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    setIsValidating(true);
    setLoading(true);

    try {
      // Test the API key by updating settings
      await apiClient.settings.update({ tmdbApiKey: tmdbKey.apiKey });
      clearErrors();
      nextStep();
    } catch {
      setErrors({
        apiKey: ["Invalid TMDB API key. Please check your key and try again."],
      });
    } finally {
      setIsValidating(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="text-sm text-gray-500">Step 2 of {totalSteps}</div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Key className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">TMDB API Key</h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            Enter your TMDB (The Movie Database) API key to enable metadata
            fetching for your media library.
          </p>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TMDB API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={tmdbKey.apiKey}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter your TMDB API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {useSetupStore.getState().errors.apiKey && (
              <p className="mt-2 text-sm text-red-600">
                {useSetupStore.getState().errors.apiKey[0]}
              </p>
            )}
          </div>

          {/* Help text */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ</div>
              <div className="space-y-2">
                <p className="text-blue-800 font-medium">
                  Need a TMDB API key?
                </p>
                <p className="text-blue-700 text-sm">
                  Visit TMDB to create a free account and get your API key. It's
                  free and takes just a few minutes.
                </p>
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
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
          onClick={validateKey}
          disabled={isValidating || !tmdbKey.apiKey.trim()}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isValidating ? "Validating..." : "Next"}</span>
          {!isValidating && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
