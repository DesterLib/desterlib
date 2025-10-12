// Type declarations for webkit message handlers
interface Window {
  webkit?: {
    messageHandlers?: {
      playVideo?: {
        postMessage: (message: { url: string }) => void;
      };
    };
  };
}
