import type { ComponentChildren } from "preact";

type TabButtonProps = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ComponentChildren;
};

export function TabButton({
  active,
  onClick,
  className,
  children,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{ background: "transparent" }}
    >
      {children}
      {active && <TabUnderline />}
    </button>
  );
}

export function TabUnderline() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3] transition-all duration-300" />
  );
}
