import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

const NavLink = ({
  tab,
  activeTab,
  setActiveTab,
}: {
  tab: { id: string; label: string; href: string };
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  return (
    <Link
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`${
        activeTab === tab.id ? "" : "hover:text-white/60"
      } relative rounded-full px-4 h-10 text-sm text-white transition focus-visible:outline-2 flex items-center justify-center`}
      style={{
        WebkitTapHighlightColor: "transparent",
      }}
      to={tab.href}
    >
      {activeTab === tab.id && (
        <motion.span
          layoutId="bubble"
          className="absolute inset-0 z-10 bg-white mix-blend-difference"
          style={{ borderRadius: 9999 }}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
          }}
        />
      )}
      {tab.label}
    </Link>
  );
};

export default NavLink;
