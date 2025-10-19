import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { cn } from "@repo/ui/utils";
import { useConditionalFocusable } from "../hooks/general/useConditionalFocusable";

const HeaderLink = ({
  to,
  focusKey,
  label,
  onFocus,
  onEnterPress,
  isActive,
}: {
  to: string;
  focusKey: string;
  label: string;
  onFocus?: () => void;
  onEnterPress?: () => void;
  isActive?: boolean;
}) => {
  const router = useRouter();

  const handleEnterPress = () => {
    router.navigate({ to });
    onEnterPress?.();
  };

  const { ref, focused, isSpatialNavigationEnabled } = useConditionalFocusable({
    focusKey,
    onFocus,
    onEnterPress: handleEnterPress,
  });

  return (
    <Link
      ref={ref}
      to={to}
      className={cn(
        "h-12 px-6 flex items-center justify-center transition-all rounded-full text-[18px]",
        focused && isSpatialNavigationEnabled
          ? "ring-2 ring-blue-400 outline-none"
          : undefined,
        isActive ? "bg-white !text-black" : "hover:bg-white/10 text-foreground"
      )}
    >
      {label}
    </Link>
  );
};

const Header = () => {
  const { ref: navRef } = useConditionalFocusable({
    focusKey: "HEADER_NAV",
    focusable: false,
  });

  const { pathname } = useLocation();
  return (
    <header className="bg-background-secondary border border-white/10 text-foreground p-1 fixed top-6 left-0 right-0 z-10 w-fit mx-auto rounded-[50px]">
      <nav ref={navRef} className="mx-auto flex gap-1 items-center w-fit">
        <HeaderLink
          to="/"
          label="Home"
          isActive={pathname === "/"}
          focusKey="HEADER_HOME_LINK"
          onFocus={() => console.log("Home link focused")}
          onEnterPress={() => console.log("Home link pressed")}
        />

        <HeaderLink
          to="/library"
          label="Library"
          focusKey="HEADER_LIBRARY_LINK"
          isActive={pathname === "/library"}
          onFocus={() => console.log("Library link focused")}
          onEnterPress={() => console.log("Library link pressed")}
        />

        <HeaderLink
          to="/settings"
          label="Settings"
          focusKey="HEADER_SETTINGS_LINK"
          isActive={pathname === "/settings"}
          onFocus={() => console.log("Settings link focused")}
          onEnterPress={() => console.log("Settings link pressed")}
        />
      </nav>
    </header>
  );
};

export default Header;
