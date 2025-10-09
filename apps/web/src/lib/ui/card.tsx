import { forwardRef } from "preact/compat";

const Card = forwardRef<
  HTMLDivElement,
  {
    title: string;
    year: number;
    image: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }
>(({ title, year, image, onClick, onMouseEnter, onMouseLeave }, ref) => {
  return (
    <div
      ref={ref}
      className="relative cursor-pointer group"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        src={image}
        alt={title}
        className="w-full group-hover:scale-105 aspect-video object-cover rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
      />
      <div className="mt-2 group-hover:translate-y-2 ease-out opacity-90 transition-all duration-300">
        <h2 className="text-sm font-semibold text-[#f5f5f7] m-0 leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-[#86868b] m-0 mt-0.5">{year}</p>
      </div>
    </div>
  );
});

export default Card;
