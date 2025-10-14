import { forwardRef } from "react";

const Card = forwardRef<
  HTMLDivElement,
  {
    title: string;
    year: number;
    image: string;
    onClick?: () => void;
  }
>(({ title, year, image = "", onClick }, ref) => {
  return (
    <div ref={ref} className="relative cursor-pointer group" onClick={onClick}>
      <img
        src={image !== "" ? image : "/placeholder.png"}
        alt={title}
        className="w-full group-hover:scale-105 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-black group-hover:ring-white/20 aspect-video object-cover group-hover:rounded-xl rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
      />
      <div className="mt-2 group-hover:translate-y-2 ease-out opacity-90 transition-all duration-200">
        <h2 className="text-sm font-semibold text-[#f5f5f7] m-0 leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-[#86868b] m-0 mt-0.5">{year}</p>
      </div>
    </div>
  );
});

export default Card;
