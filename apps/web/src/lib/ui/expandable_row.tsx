import { useState, useRef, useEffect } from "preact/hooks";
import Card from "./card";
import { ChevronDownIcon } from "lucide-preact";
import { AnimatedHeight } from "../animation";

const ExpandableRow = ({
  title,
  items,
  setCurrentMovie,
}: {
  title: string;
  items: any[];
  setCurrentMovie: (id: number) => void;
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(1);
  const [sectionHeight, setSectionHeight] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateLayout = () => {
      const width = window.innerWidth;
      let columns = 2;

      if (width >= 1280) {
        columns = 5; // xl
      } else if (width >= 1024) {
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

  useEffect(() => {
    const updateHeight = () => {
      if (gridRef.current) {
        const width = window.innerWidth;
        const gridHeight = gridRef.current.offsetHeight;
        if (width < 768) {
          setSectionHeight(gridHeight + 70);
        } else {
          setSectionHeight(gridHeight + 78);
        }
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [visibleCount, isExpanded]);

  const visibleItems = isExpanded ? items : items.slice(0, visibleCount);

  return (
    <section
      className={`relative group/section overflow-hidden w-fit mx-auto transition-all duration-300 ease-out px-4 rounded-3xl ${
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
      <AnimatedHeight height={sectionHeight}>
        <div
          ref={gridRef}
          className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-8 gap-4 max-w-7xl mx-auto items-start"
        >
          {visibleItems.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              year={item.year}
              image={item.image}
              onClick={() => setCurrentMovie(item.id)}
            />
          ))}
        </div>
      </AnimatedHeight>
    </section>
  );
};

export default ExpandableRow;
