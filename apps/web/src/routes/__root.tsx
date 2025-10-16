import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import Header from "@/components/ui/header";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => {
  const location = useLocation();

  // Hide header on authentication pages
  const authPages = ["/login", "/register", "/setup"];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <main>
      {!isAuthPage && <Header />}
      <Outlet />
      <TanStackRouterDevtools />
    </main>
  );
};

export const Route = createRootRoute({ component: RootLayout });
