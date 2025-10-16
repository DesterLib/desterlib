import { useSetupStore } from "@/lib/stores/setup";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function WelcomeStep() {
  const { nextStep, totalSteps } = useSetupStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Home</span>
      </button>

      {/* Step indicator */}
      <div className="text-sm text-gray-500">Step 1 of {totalSteps}</div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Dester
            </h1>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            Let's set up your media library in just a few steps. We'll help you
            configure TMDB integration and organize your collections.
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-3">
            What we'll set up:
          </h3>
          <ul className="space-y-2 text-purple-800">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>TMDB API key for metadata</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Media collections (Movies, TV Shows)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Library paths and organization</span>
            </li>
          </ul>
        </div>

        <div className="text-sm text-gray-500">
          This should only take a few minutes to complete.
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={nextStep}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-medium flex items-center space-x-2"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
