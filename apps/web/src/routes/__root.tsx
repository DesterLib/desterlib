import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import Header from "@/components/ui/header";
import BottomNav from "@/components/ui/bottom-nav";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import {
  CircleCheck,
  Info,
  TriangleAlert,
  OctagonX,
  Loader2,
} from "lucide-react";

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
      <Toaster
        position="top-right"
        closeButton
        duration={4000}
        visibleToasts={5}
        expand={false}
        gap={12}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "bg-card/95 backdrop-blur-lg border border-border rounded-[var(--radius)] shadow-2xl p-4 pr-10 text-foreground w-full",
            title: "text-sm font-semibold text-foreground",
            description: "text-xs text-muted-foreground mt-1",
            actionButton:
              "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors",
            cancelButton:
              "bg-white/5 text-muted-foreground border border-border px-4 py-2 rounded-md font-medium hover:bg-white/10 hover:text-foreground transition-colors",
            closeButton:
              "!absolute !top-3 !right-3 !bg-white/5 !backdrop-blur-sm !border !border-border !text-muted-foreground hover:!bg-white/10 hover:!text-foreground !w-6 !h-6 !rounded-full !flex !items-center !justify-center !transition-all !opacity-80 hover:!opacity-100 !p-0",
            success: "!border-l-4 !border-l-green-500",
            error: "!border-l-4 !border-l-red-500",
            warning: "!border-l-4 !border-l-yellow-500",
            info: "!border-l-4 !border-l-blue-500",
          },
        }}
        icons={{
          success: <CircleCheck className="size-4 text-green-500" />,
          info: <Info className="size-4 text-blue-500" />,
          warning: <TriangleAlert className="size-4 text-yellow-500" />,
          error: <OctagonX className="size-4 text-red-500" />,
          loading: <Loader2 className="size-4 text-blue-500 animate-spin" />,
        }}
      />
      <TanStackRouterDevtools />
    </main>
  );
};

export const Route = createRootRoute({ component: RootLayout });
