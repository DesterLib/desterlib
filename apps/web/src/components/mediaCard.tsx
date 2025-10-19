import { useConditionalFocusable } from "../hooks/general/useConditionalFocusable";

interface MediaCardProps {
  focusKey?: string;
  title?: string;
  year?: string;
  imageUrl?: string;
  onClick?: () => void;
}

const MediaCard = ({
  focusKey,
  title,
  year,
  imageUrl,
  onClick,
}: MediaCardProps) => {
  const { ref, focused, hasFocusedChild } = useConditionalFocusable({
    focusKey,
    trackChildren: true,
    onEnterPress: () => {
      onClick?.();
    },
    extraProps: {
      role: "button",
      "aria-label": `${title} (${year})`,
      tabIndex: 0,
    },
  });

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      ref={ref}
      className="group cursor-pointer w-full max-w-sm"
      onClick={handleClick}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border-2 transition-all duration-300 ease-out ${
          focused || hasFocusedChild
            ? "border-blue-400 shadow-blue-400/25 scale-[1.02] shadow-3xl"
            : "border-white/20 shadow-2xl group-hover:scale-[1.02] group-hover:shadow-3xl"
        }`}
      >
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={imageUrl}
            alt={`${title} poster`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-xl group-hover:text-blue-400 transition-colors duration-200">
          {title}
        </h3>
        <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-200">
          {year}
        </span>
      </div>
    </div>
  );
};

export default MediaCard;
