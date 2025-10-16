/**
 * Component to display library scan progress in real-time
 */

import {
  Loader2,
  CheckCircle,
  XCircle,
  FileSearch,
  Database,
} from "lucide-react";
import type { ScanProgress } from "@/hooks/useScanProgress";

interface ScanProgressCardProps {
  progress: ScanProgress;
}

export function ScanProgressCard({ progress }: ScanProgressCardProps) {
  const { status, message, data, libraryName } = progress;

  // Determine which icon to show
  const renderIcon = () => {
    switch (status) {
      case "started":
      case "progress":
        return (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
        );
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
      default:
        return <FileSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };

  // Determine the title
  const getTitle = () => {
    switch (status) {
      case "started":
        return `Starting scan: ${libraryName}`;
      case "progress":
        if (message.includes("Found")) {
          return `Scanning: ${libraryName}`;
        } else if (message.includes("Saving")) {
          return `Processing: ${libraryName}`;
        }
        return `Scanning: ${libraryName}`;
      case "completed":
        return `Scan completed: ${libraryName}`;
      case "failed":
        return `Scan failed: ${libraryName}`;
      default:
        return `Scanning: ${libraryName}`;
    }
  };

  // Get detailed message
  const getDetailedMessage = () => {
    if (status === "completed" && data?.stats) {
      const { added, updated, skipped } = data.stats;
      const parts: string[] = [];

      if (added > 0) parts.push(`${added} added`);
      if (updated > 0) parts.push(`${updated} updated`);
      if (skipped > 0) parts.push(`${skipped} skipped`);

      if (parts.length > 0) {
        return `Processed ${data.totalFiles || 0} files: ${parts.join(", ")}`;
      }
      return message;
    }

    if (status === "progress") {
      if (message.includes("Found") && data?.totalFiles !== undefined) {
        return (
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-blue-400" />
            <span>
              Found {data.totalFiles} {data.mediaType?.toLowerCase() || "media"}{" "}
              file{data.totalFiles === 1 ? "" : "s"}
            </span>
          </div>
        );
      }

      if (message.includes("Saving") && data?.totalFiles !== undefined) {
        return (
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span>
              Saving {data.totalFiles} file{data.totalFiles === 1 ? "" : "s"} to
              database and fetching metadata...
            </span>
          </div>
        );
      }
    }

    return message;
  };

  // Get background color based on status
  const getBgColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/20";
      case "failed":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-white/10 border-white/10";
    }
  };

  return (
    <div
      className={`backdrop-blur-lg rounded-xl p-4 border ${getBgColor()} transition-colors duration-300`}
    >
      <div className="flex items-start gap-3">
        {renderIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{getTitle()}</p>
          <div className="text-xs text-white/60 mt-1">
            {getDetailedMessage()}
          </div>

          {/* Progress indicator for active scans */}
          {(status === "started" || status === "progress") && (
            <div className="mt-3">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"
                  style={{
                    width: message.includes("Found")
                      ? "33%"
                      : message.includes("Saving")
                        ? "66%"
                        : "10%",
                    transition: "width 0.5s ease-in-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
