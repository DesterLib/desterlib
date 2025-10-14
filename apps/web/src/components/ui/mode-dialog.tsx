import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { BookOpen, Headphones, MonitorPlay } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import useAppStore from "@/lib/stores/app.store";

type AppMode = "watch" | "listen" | "read";

const ModeDialog = ({
  isDialogOpen,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}) => {
  const { appMode, setAppMode } = useAppStore();

  const modes = [
    {
      icon: MonitorPlay,
      label: "Watch",
      value: "watch",
      style: "from-purple-500 via-pink-500 to-orange-500",
    },

    {
      icon: Headphones,
      label: "Listen",
      value: "listen",
      style: "from-green-500 via-lime-500 to-emerald-500",
    },
    {
      icon: BookOpen,
      label: "Read",
      value: "read",
      style: "from-blue-500 via-indigo-500 to-violet-500",
    },
  ];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-5xl bg-white/10 backdrop-blur-xl rounded-4xl border-none">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-3xl font-bold text-center">
            Choose Your Experience
          </DialogTitle>
          <DialogDescription className="text-center text-neutral-400 text-base">
            Switch between Watch, Listen, or Read mode
          </DialogDescription>
        </DialogHeader>
        <motion.div className="flex mx-auto items-center p-2 justify-center w-fit gap-2 border border-white/10 rounded-full">
          <LayoutGroup id="mode-bubble">
            {modes.map((mode) => (
              <div key={mode.value} className="relative">
                <AnimatePresence>
                  {appMode === mode.value && (
                    <motion.span
                      key={`glow-${mode.value}`}
                      layoutId="bubble-glow"
                      className={cn(
                        "absolute inset-[-8px] bg-gradient-to-r blur-xl rounded-full pointer-events-none",
                        mode.style
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        opacity: { duration: 0.25 },
                        layout: {
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        },
                      }}
                    />
                  )}
                </AnimatePresence>
                <button
                  className={cn(
                    "aspect-square flex items-center transition-colors justify-center relative h-20 w-20 isolate",
                    appMode === mode.value && "text-black"
                  )}
                  onClick={() => setAppMode(mode.value as AppMode)}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <mode.icon className="w-10 h-10 relative z-20" />
                  {appMode === mode.value && (
                    <motion.span
                      layoutId="bubble"
                      className="absolute inset-0 z-10 bg-white mix-blend-difference"
                      style={{ borderRadius: 9999 }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>
              </div>
            ))}
          </LayoutGroup>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeDialog;
