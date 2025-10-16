import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-guards";
import { motion } from "motion/react";

export const Route = createFileRoute("/listen")({
  component: ListenPage,
  beforeLoad: async () => {
    // Require authentication (bypassed in offline mode)
    await requireAuth();
  },
});

function ListenPage() {
  return (
    <div className="pt-4 md:pt-[138px] px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-8"
      >
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-white mb-4">Listen</h1>
          <p className="text-white/60">
            Music and audio content will appear here
          </p>
        </div>
      </motion.div>
    </div>
  );
}
