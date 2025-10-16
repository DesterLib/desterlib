/**
 * TypeScript declarations for Flutter WebView JavaScript channels
 * Using webview_flutter package
 */

interface JavaScriptChannel {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    // JavaScript channels from Flutter
    pickDirectory?: JavaScriptChannel;
    playVideo?: JavaScriptChannel;

    // Callback for Flutter to send directory path back
    flutter_directory_callback?: (path: string) => void;
  }
}

export {};
