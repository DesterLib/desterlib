import { createRootRoute, Outlet } from "@tanstack/react-router";
import Header from "@/components/ui/header";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <main>
    <Header />
    <Outlet />
    <TanStackRouterDevtools />
  </main>
);

export const Route = createRootRoute({ component: RootLayout });
