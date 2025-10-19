import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Link as RadixLink } from "@radix-ui/themes";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <RadixLink asChild>
        <Link to="/">Home</Link>
      </RadixLink>
    </div>
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
