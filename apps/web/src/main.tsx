import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { init } from "@noriginmedia/norigin-spatial-navigation";
import "./index.css";
import { isTVDevice } from "./utils/deviceDetection";

import { routeTree } from "./routeTree.gen";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Only initialize spatial navigation if running on TV
if (isTVDevice()) {
  init({
    debug: false,
    throttle: 16, // 60fps throttling for smooth navigation
    visualDebug: false,
    // Enable keyboard navigation
    throttleKeypresses: true,
  });
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}
