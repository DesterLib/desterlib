import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import Header from "@/components/ui/header";
import BottomNav from "@/components/ui/bottom-nav";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => {
  const location = useLocation();

  // Hide header and bottom nav on authentication pages
  const authPages = ["/login", "/register", "/setup"];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <main className="min-h-screen bg-background">
      {!isAuthPage && <Header />}
      <div className={!isAuthPage ? "pb-20 md:pb-0" : ""}>
        <Outlet />
      </div>
      {!isAuthPage && <BottomNav />}
      <TanStackRouterDevtools />
    </main>
  );
};

export const Route = createRootRoute({ component: RootLayout });
