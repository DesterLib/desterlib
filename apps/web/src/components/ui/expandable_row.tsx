import { useState, useEffect } from "react";
import Card from "./card";
import { ChevronDownIcon } from "lucide-react";

const ExpandableRow = ({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: { id: string; title: string; year: number; image: string }[];
  onItemClick: (id: string) => void;
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const calculateLayout = () => {
      const width = window.innerWidth;
      let columns = 2;

      if (width >= 1024) {
        columns = 4; // lg
      } else if (width >= 768) {
        columns = 3; // md
      } else if (width >= 640) {
        columns = 2; // sm
      }

      setVisibleCount(columns);
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, []);

  const visibleItems = isExpanded ? items : items.slice(0, visibleCount);

  return (
    <section
      className={`relative group/section w-fit mx-auto transition-all duration-300 ease-out px-4 rounded-3xl ${
        isExpanded ? "bg-white/10" : ""
      }`}
    >
      <div className="h-14 lg:h-12 flex items-center justify-between w-full">
        <h2 className="text-xl font-medium text-white/40">{title}</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-fit flex h-12 items-center justify-center gap-2 uppercase text-sm font-medium text-white/40 hover:text-white/60 group-hover/section:opacity-100 transition-[opacity,color] duration-200"
        >
          <div
            className="transition-transform duration-300 ease-out"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDownIcon />
          </div>
        </button>
      </div>
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-8 gap-4 max-w-7xl mx-auto items-start pb-4 py-2">
        {visibleItems.map((item) => (
          <Card
            key={item.id}
            title={item.title}
            year={item.year}
            image={item.image}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default ExpandableRow;
