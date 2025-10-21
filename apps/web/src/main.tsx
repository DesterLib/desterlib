import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { init } from "@noriginmedia/norigin-spatial-navigation";
import "./index.css";
import { isTVDevice } from "./utils/deviceDetection";
import type { FlutterVideoData } from "./utils/flutterBridge";
import { routeTree } from "./routeTree.gen";

// Extend window interface for Flutter bridge
declare global {
  interface Window {
    isFlutterWebView?: boolean;
    flutterPlayVideo?: (videoData: FlutterVideoData) => Promise<void>;
    flutterOpenSettings?: () => Promise<void>;
    __REACT_ROOT_MOUNTED__?: boolean;
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "#000",
            color: "#fff",
            flexDirection: "column",
            padding: "20px",
          }}
        >
          <h2>Something went wrong</h2>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (
        failureCount,
        error: Error & { response?: { status: number }; code?: string }
      ) => {
        // Don't retry on network errors or 4xx/5xx errors
        if (error?.response?.status && error.response.status >= 400) {
          return false;
        }
        // Don't retry in Flutter WebView for network errors
        if (
          window.isFlutterWebView &&
          (error?.message?.includes("Network Error") ||
            error?.code === "NETWORK_ERROR")
        ) {
          return false;
        }
        // Retry up to 1 time for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes
      networkMode: "online", // Only run queries when online
    },
    mutations: {
      retry: (
        failureCount,
        error: Error & { response?: { status: number } }
      ) => {
        // Don't retry mutations on client errors (4xx)
        if (
          error?.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          return false;
        }
        return failureCount < 1;
      },
      networkMode: "online",
    },
  },
});

// Create Router
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Initialize spatial navigation for TV devices
if (isTVDevice()) {
  init({
    debug: false,
    throttle: 16,
    visualDebug: false,
    throttleKeypresses: true,
  });
}

// Setup Flutter bridge listener
function setupFlutterBridge() {
  console.log("🔗 Setting up Flutter bridge listener...");

  // Listen for bridge ready event
  window.addEventListener("flutterBridgeReady", () => {
    console.log("✅ Flutter bridge ready event received");

    // Verify bridge is functional
    if (typeof window.flutterPlayVideo === "function") {
      console.log("✅ Flutter bridge verified and functional");
    } else {
      console.warn("⚠️ Bridge event received but function not available");
    }
  });

  // Check if bridge is already available
  if (window.isFlutterWebView) {
    if (window.flutterPlayVideo) {
      console.log("✅ Flutter bridge already available");
    } else {
      console.log("⏳ Flutter WebView detected, waiting for bridge...");
    }
  } else {
    console.log("🌐 Running in standard browser mode");
  }
}

// Render React app
function renderApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("❌ Root element not found!");
    return;
  }

  // Prevent double mounting
  if (window.__REACT_ROOT_MOUNTED__) {
    console.log("⚠️ React root already mounted, skipping re-render");
    return;
  }

  console.log("🎨 Rendering React app...");

  // Clear existing content
  rootElement.innerHTML = "";

  // Create and render root
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <ErrorBoundary>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>
    </ErrorBoundary>
  );

  window.__REACT_ROOT_MOUNTED__ = true;
  console.log("✅ React app rendered successfully");
}

// Initialize app
console.log("🚀 Initializing app...");

// Setup Flutter bridge (non-blocking)
setupFlutterBridge();

// Render app immediately
renderApp();

// Handle page visibility changes (for app backgrounding/foregrounding)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("👁️ Page became visible");

    // Verify bridge is still available
    if (window.isFlutterWebView && !window.flutterPlayVideo) {
      console.warn(
        "⚠️ Bridge lost after visibility change, waiting for re-injection..."
      );
    }
  }
});

// Prevent accidental navigation
window.addEventListener("beforeunload", () => {
  if (window.isFlutterWebView) {
    // Don't prevent in Flutter WebView
    return;
  }

  // Optional: warn users in browser
  // PreventDefault and returnValue would go here if needed
});

console.log("✅ App initialization complete");
