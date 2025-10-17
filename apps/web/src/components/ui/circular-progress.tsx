import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // Progress value between 0 and 100
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  strokeWidth = 2.5,
  className = "",
  ...divProps
}: CircularProgressProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    if (
      containerRef.current &&
      "getBoundingClientRect" in containerRef.current
    ) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSize(Math.min(width, height));
    }
  }, []);

  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div ref={containerRef} className={className} {...divProps}>
      {size > 0 && (
        <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeLinecap="round"
            className="fill-none stroke-white/20"
            style={{
              strokeWidth,
              strokeDasharray: circumference,
              strokeDashoffset: 0,
            }}
          />
          {/* Animated progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeLinecap="round"
            className="fill-none stroke-emerald-500"
            style={{
              strokeWidth,
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
            initial={{
              strokeDashoffset: circumference,
              strokeDasharray: circumference,
            }}
            animate={{
              strokeDashoffset: offset,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          />
        </svg>
      )}
    </div>
  );
}
