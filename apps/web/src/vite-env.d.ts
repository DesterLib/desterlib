/// <reference types="vite/client" />

// Extend Window interface for Flutter WebView JavaScript channels
interface Window {
  playVideo?: {
    postMessage: (message: string) => void;
  };
}
