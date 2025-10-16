import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import { WebSocketProvider } from "./providers/WebSocketProvider";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Create a QueryClient instance with offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // Keep cache for 24 hours for offline use
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch when coming back online
      retry: (failureCount, error) => {
        // Don't retry on network errors when offline
        if (error instanceof Error && error.message.includes("fetch")) {
          return false;
        }
        return failureCount < 3;
      },
      networkMode: "offlineFirst", // Try to use cache first when offline
    },
    mutations: {
      networkMode: "online", // Mutations require online connection
      retry: false,
    },
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineProvider>
            <WebSocketProvider>
              <RouterProvider router={router} />
            </WebSocketProvider>
          </OfflineProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
