import { useContext } from "react";
import { OfflineContext } from "@/contexts/OfflineContext";

/**
 * Hook to access offline context
 */
export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}
