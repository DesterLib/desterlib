const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 53 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M47.3006 25.3133C47.3006 37.4566 35.9688 47.3006 24.3299 47.3006C12.6911 47.3006 9.99963 37.4566 9.99963 25.3133C9.99963 13.1701 12.6911 5.70062 24.3299 5.70062C35.9688 5.70062 47.3006 13.1701 47.3006 25.3133Z"
        fill="white"
      />
      <rect
        x="5.70068"
        y="18.6292"
        width="27.8176"
        height="15.7429"
        rx="7.87146"
        fill="url(#paint0_linear_1741_1575)"
        stroke="white"
        strokeWidth="3.24156"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1741_1575"
          x1="9.95762"
          y1="18.6292"
          x2="30.9615"
          y2="33.5198"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFB3" />
          <stop offset="1" stopColor="#00DBAF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
