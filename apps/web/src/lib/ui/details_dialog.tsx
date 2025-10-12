import { XIcon, PlayIcon, PlusIcon, Film } from "lucide-preact";
import { useRef } from "preact/hooks";
import Button from "./button";
import { useBodyScrollLock } from "../hooks/use_body_scroll_lock";
import { useMeasuredHeight } from "../hooks/use_measured_height";
import { AnimatedHeight } from "../animation";
import { ModalOverlay, ModalCard } from "./modal";
import type { Media } from "../api/client";

const DetailsDialog = ({
  item,
  onClose,
  isOpen = true,
}: {
  item: Media;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentHeight = useMeasuredHeight(contentRef, []);

  // Lock body scroll when dialog is open
  useBodyScrollLock(isOpen);

  // Get display values
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : undefined;
  const displayImage =
    item.backdropUrl ||
    item.posterUrl ||
    "https://via.placeholder.com/1280x720/1a1a1a/666666?text=No+Image";

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-start lg:items-center justify-center z-50 overflow-hidden p-0 lg:p-4"
      onClose={onClose}
      isOpen={isOpen}
    >
      <ModalCard
        className="relative lg:rounded-2xl min-h-full lg:min-h-0 lg:max-h-[calc(100vh-2rem)] lg:max-w-[900px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-y-auto lg:my-4 bg-[#1d1d1f]"
        isOpen={isOpen}
      >
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="subtle"
          size="icon"
          className="absolute top-4 right-4 z-10 rounded-full"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </Button>

        {/* Hero Image */}
        <div className="relative">
          <img
            src={displayImage}
            alt={item.title}
            className="w-full aspect-video object-cover block"
            style={{
              maskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
              WebkitMaskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
            }}
          />
        </div>

        <div className="px-8 pb-8 -mt-16 relative z-10">
          {/* Title & Year */}
          <div className="mb-6">
            <h2 className="text-[2.5rem] font-bold m-0 mb-2 text-[#f5f5f7] tracking-tight leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-3 text-[#86868b] text-sm">
              {year && (
                <>
                  <span>{year}</span>
                  <span>•</span>
                </>
              )}
              <span className="uppercase">{item.type.replace("_", " ")}</span>
              {item.rating && (
                <>
                  <span>•</span>
                  <span className="text-yellow-500">
                    ★ {item.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <Button variant="primary" size="md" className="gap-2">
              <PlayIcon className="w-5 h-5" fill="white" />
              Play
            </Button>
            <Button variant="outline" size="md" className="gap-2">
              <PlusIcon className="w-5 h-5" />
              Watchlist
            </Button>
          </div>

          {/* Description */}
          <AnimatedHeight height={contentHeight}>
            <div ref={contentRef}>
              <div className="mb-6">
                <h3 className="text-[#f5f5f7] text-lg font-semibold mb-3 flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#0071e3]" />
                  Overview
                </h3>
                <p className="text-[#d2d2d7] text-base leading-relaxed m-0">
                  {item.description || "No description available."}
                </p>
              </div>
            </div>
          </AnimatedHeight>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
};

export default DetailsDialog;
