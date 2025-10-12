import {
  XIcon,
  PlayIcon,
  PlusIcon,
  InfoIcon,
  VideoIcon,
  AudioLines,
  Captions,
  Film,
} from "lucide-preact";
import { useState, useRef } from "preact/hooks";
import Button from "./button";
import { useBodyScrollLock } from "../hooks/use_body_scroll_lock";
import { useMeasuredHeight } from "../hooks/use_measured_height";
import { AnimatedHeight } from "../animation";
import { ModalOverlay, ModalCard } from "./modal";
import { TabButton } from "./tabs";
import type { Movie } from "../api/client";

const DetailsDialog = ({
  item,
  setCurrentMovie,
  isOpen = true,
}: {
  item: Movie;
  setCurrentMovie: (movie: any) => void;
  isOpen: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "technical">(
    "overview"
  );
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentHeight = useMeasuredHeight(contentRef, [activeTab]);

  // Lock body scroll when dialog is open
  useBodyScrollLock(isOpen);

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-start lg:items-center justify-center z-50 overflow-hidden p-0 lg:p-4"
      onClose={() => setCurrentMovie(null)}
      isOpen={isOpen}
    >
      <ModalCard
        className="relative lg:rounded-2xl min-h-full lg:min-h-0 lg:max-h-[calc(100vh-2rem)] lg:max-w-[900px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-y-auto lg:my-4 bg-[#1d1d1f]"
        isOpen={isOpen}
      >
        {/* Close button */}
        <Button
          onClick={() => setCurrentMovie(null)}
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
            src={item.image}
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
              <span>{item.year}</span>
              <span>•</span>
              <span>{item.rating}</span>
              <span>•</span>
              <span>{item.duration}</span>
              <span>•</span>
              <span className="text-yellow-500">★ {item.imdbRating}</span>
            </div>
            <div className="flex gap-2 mt-3">
              {item.genre.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-[#2d2d2f] text-[#86868b] text-xs rounded-full"
                >
                  {g}
                </span>
              ))}
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[#424245]">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-3 border-none cursor-pointer font-medium text-sm transition-all duration-200 relative ${
                activeTab === "overview"
                  ? "text-[#0071e3]"
                  : "text-[#86868b] hover:text-[#f5f5f7]"
              }`}
            >
              <Film className="w-4 h-4" />
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "technical"}
              onClick={() => setActiveTab("technical")}
              className={`flex items-center gap-2 px-4 py-3 border-none cursor-pointer font-medium text-sm transition-all duration-200 relative ${
                activeTab === "technical"
                  ? "text-[#0071e3]"
                  : "text-[#86868b] hover:text-[#f5f5f7]"
              }`}
            >
              <InfoIcon className="w-4 h-4" />
              Technical Details
            </TabButton>
          </div>

          {/* Tab Content */}
          <AnimatedHeight height={contentHeight}>
            <div ref={contentRef}>
              {activeTab === "overview" ? (
                <div key="overview" className="transition-opacity duration-200">
                  {/* Description */}
                  <div className="mb-6">
                    <p className="text-[#d2d2d7] text-base leading-relaxed m-0">
                      {item.description}
                    </p>
                  </div>

                  {/* Director & Cast */}
                  <div className="mb-6 space-y-3">
                    <div>
                      <span className="text-[#86868b] text-sm">Director: </span>
                      <span className="text-[#f5f5f7] text-sm">
                        {item.director}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#86868b] text-sm">Cast: </span>
                      <span className="text-[#f5f5f7] text-sm">
                        {item.cast.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key="technical"
                  className="transition-opacity duration-200"
                >
                  {/* Technical Info Section */}
                  <div>
                    {/* Video Info */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <VideoIcon className="w-4 h-4 text-[#0071e3]" />
                        <h4 className="text-sm font-semibold text-[#f5f5f7] m-0">
                          Video
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div>
                          <div className="text-xs text-[#86868b]">
                            Resolution
                          </div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.resolution}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#86868b]">Codec</div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.videoCodec}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#86868b]">Bitrate</div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.videoBitrate}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#86868b]">
                            Frame Rate
                          </div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.frameRate}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audio Info */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AudioLines className="w-4 h-4 text-[#0071e3]" />
                        <h4 className="text-sm font-semibold text-[#f5f5f7] m-0">
                          Audio Tracks
                        </h4>
                      </div>
                      <div className="space-y-2 pl-6">
                        {item.audioTracks.map((track, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg"
                          >
                            <span className="text-sm text-[#f5f5f7]">
                              {track.language}
                            </span>
                            <span className="text-xs text-[#86868b]">
                              {track.codec} • {track.channels}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subtitles */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Captions className="w-4 h-4 text-[#0071e3]" />
                        <h4 className="text-sm font-semibold text-[#f5f5f7] m-0">
                          Subtitles
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {item.subtitles.map((sub) => (
                          <span
                            key={sub}
                            className="px-3 py-1 bg-white/10 text-[#86868b] text-xs rounded-md"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* File Info */}
                    <div>
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div>
                          <div className="text-xs text-[#86868b]">
                            File Size
                          </div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.fileSize}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#86868b]">
                            Audio Codec
                          </div>
                          <div className="text-sm text-[#f5f5f7]">
                            {item.audioCodec}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AnimatedHeight>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
};

export default DetailsDialog;
