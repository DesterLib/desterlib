import { useSetupStore } from "@/lib/stores/setup";
import { TMDBKeyStep } from "./steps/TMDBKeyStep";
import { CollectionsStep } from "./steps/CollectionsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CompleteStep } from "./steps/CompleteStep";

export function SetupWizard() {
  const { currentStep } = useSetupStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <TMDBKeyStep />;
      case 3:
        return <CollectionsStep />;
      case 4:
        return <ReviewStep />;
      case 5:
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="flex">
            {/* Left Panel - Content */}
            <div className="flex-1 p-8">{renderStep()}</div>

            {/* Right Panel - Visual */}
            <div className="w-96 bg-gradient-to-br from-white/80 to-purple-100/80 p-8 flex items-center justify-center relative overflow-hidden">
              {/* Background blur effect */}
              <div className="absolute inset-0 backdrop-blur-sm"></div>

              <div className="relative z-10">
                {/* Main central circle with glow effect */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full opacity-80 shadow-lg animate-pulse"></div>
                  <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full opacity-30 blur-xl"></div>
                </div>

                {/* Floating circles */}
                <div
                  className="absolute -top-4 -left-4 w-12 h-12 bg-cyan-300 rounded-full opacity-70 animate-bounce"
                  style={{ animationDelay: "0s", animationDuration: "3s" }}
                ></div>
                <div
                  className="absolute -bottom-2 -right-6 w-8 h-8 bg-yellow-300 rounded-full opacity-60 animate-bounce"
                  style={{ animationDelay: "1s", animationDuration: "4s" }}
                ></div>
                <div
                  className="absolute top-1/2 -left-8 w-10 h-10 bg-purple-400 rounded-full opacity-75 animate-bounce"
                  style={{ animationDelay: "2s", animationDuration: "3.5s" }}
                ></div>
                <div
                  className="absolute top-1/4 -right-4 w-6 h-6 bg-pink-300 rounded-full opacity-65 animate-bounce"
                  style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}
                ></div>

                {/* Connection lines with animation */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 200 200"
                >
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#3D3D3D" stopOpacity="0.1" />
                      <stop
                        offset="50%"
                        stopColor="#3D3D3D"
                        stopOpacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stopColor="#3D3D3D"
                        stopOpacity="0.1"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M100,40 Q60,80 40,120 Q20,160 60,180"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    className="animate-pulse"
                  />
                  <path
                    d="M100,40 Q140,80 160,120 Q180,160 140,180"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    className="animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                  <path
                    d="M100,40 Q80,100 100,160"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    className="animate-pulse"
                    style={{ animationDelay: "2s" }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
