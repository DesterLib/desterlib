import { create } from "zustand";

type AppMode = "watch" | "listen" | "read";

const useAppStore = create<{
  appMode: AppMode;
  setAppMode: (appMode: AppMode) => void;
}>((set) => ({
  appMode: "watch" as AppMode,
  setAppMode: (appMode: AppMode) => {
    set({ appMode });
  },
}));

export default useAppStore;
