import type { ComponentChildren, JSX } from "preact";
import { Animated } from "../animation";

type ModalOverlayProps = {
  children?: ComponentChildren;
  className?: string;
  onClose?: () => void;
  isOpen?: boolean;
};

export function ModalOverlay({
  children,
  className,
  onClose,
  isOpen = true,
}: ModalOverlayProps) {
  return (
    <Animated
      show={isOpen}
      preset="fade"
      duration={300}
      className={className}
      onClick={onClose}
      style={{ overscrollBehavior: "contain" }}
    >
      {children}
    </Animated>
  );
}

type ModalCardProps = {
  children?: ComponentChildren;
  className?: string;
  style?: JSX.CSSProperties;
  isOpen?: boolean;
};

export function ModalCard({
  children,
  className,
  style,
  isOpen = true,
}: ModalCardProps) {
  return (
    <Animated
      show={isOpen}
      preset="fadeScale"
      duration={300}
      className={className}
      onClick={(e) => e.stopPropagation()}
      style={{
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      {children}
    </Animated>
  );
}
