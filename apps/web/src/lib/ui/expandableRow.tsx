import { useState, useRef, useEffect } from "preact/hooks";
import Card from "./card";
import { ChevronDownIcon } from "lucide-preact";
import { motion, AnimatePresence } from "motion/react";

const ExpandableRow = ({
  title,
  items,
  setCurrentMovie,
  setHoveredMovie,
  handleExtractColors,
}: {
  title: string;
  items: any[];
  setCurrentMovie: (id: number) => void;
  setHoveredMovie: (id: number | null) => void;
  handleExtractColors: (image: string, id: number) => void;
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
    <motion.section
      className={`relative group/section overflow-hidden w-fit mx-auto transition-all duration-300 ease-out px-4 lg:p-4 rounded-3xl ${isExpanded ? "bg-white/10" : ""}`}
      style={{ height: sectionHeight > 0 ? `${sectionHeight}px` : "auto" }}
    >
      <div className="h-14 lg:h-12 flex items-center justify-between w-full">
        <h2 className="text-xl font-medium text-white/40">{title}</h2>
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-fit flex h-12 items-center justify-center gap-2 uppercase text-sm font-medium text-white/40 hover:text-white/60 group-hover/section:opacity-100 transition-[opacity,colors] duration-200"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ChevronDownIcon />
          </motion.div>
        </motion.button>
      </div>
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
            onMouseEnter={() => {
              setHoveredMovie(item.id);
              handleExtractColors(item.image, item.id);
            }}
            onMouseLeave={() => setHoveredMovie(null as number | null)}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default ExpandableRow;
