import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useEffect } from "react";
import Header from "../components/custom/header";
import { useConditionalFocusable } from "../hooks/general/useConditionalFocusable";

const RootLayout = () => {
  const { ref, isSpatialNavigationEnabled } = useConditionalFocusable({
    focusKey: "ROOT",
    focusable: false,
  });

  useEffect(() => {
    // Only set initial focus if using spatial navigation (TV mode)
    if (isSpatialNavigationEnabled) {
      const timer = setTimeout(() => {
        // Try to focus the first media card
        setFocus("media-card-1");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isSpatialNavigationEnabled]);

  return (
    <div ref={ref} className="min-h-screen bg-background text-foreground">
      <Header />
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout });
