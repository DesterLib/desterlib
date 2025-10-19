/**
 * TypeScript declarations for Flutter WebView JavaScript channels
 * Using webview_flutter package
 */

interface JavaScriptChannel {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    // JavaScript channels from Flutter (legacy webview_flutter)
    pickDirectory?: JavaScriptChannel;
    playVideo?: JavaScriptChannel;

    // Callback for Flutter to send directory path back (legacy)
    flutter_directory_callback?: (path: string) => void;

    // Modern flutter_inappwebview bridge
    isFlutterWebView?: boolean;
    flutterPickDirectory?: () => Promise<string>;
    flutterPlayVideo?: (videoData: {
      url: string;
      title?: string;
      season?: number;
      episode?: number;
      episodeTitle?: string;
    }) => Promise<void>;
  }
}

export {};
