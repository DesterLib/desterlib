import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Server,
  Plus,
  Check,
  Trash2,
  WifiOff,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import {
  getSavedServers,
  setActiveServer,
  addServer,
  deleteServer,
  updateServer,
  getForceOfflineMode,
  setForceOfflineMode,
  type ServerEndpoint,
} from "@/lib/server-storage";

interface ServersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServersDialog({ isOpen, onClose }: ServersDialogProps) {
  const [servers, setServers] = useState<ServerEndpoint[]>(getSavedServers());
  const [forceOffline, setForceOfflineLocal] = useState(getForceOfflineMode());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [error, setError] = useState("");

  const handleSetActive = (serverId: string) => {
    setActiveServer(serverId);
    setServers(getSavedServers());
    // Reload page to apply new server
    window.location.reload();
  };

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) {
      setError("Name and URL are required");
      return;
    }

    if (
      !newServerUrl.startsWith("http://") &&
      !newServerUrl.startsWith("https://")
    ) {
      setError("URL must start with http:// or https://");
      return;
    }

    addServer(newServerName.trim(), newServerUrl.trim());
    setServers(getSavedServers());
    setIsAdding(false);
    setNewServerName("");
    setNewServerUrl("");
    setError("");
  };

  const handleUpdateServer = (serverId: string) => {
    if (!newServerName.trim() || !newServerUrl.trim()) {
      setError("Name and URL are required");
      return;
    }

    if (
      !newServerUrl.startsWith("http://") &&
      !newServerUrl.startsWith("https://")
    ) {
      setError("URL must start with http:// or https://");
      return;
    }

    updateServer(serverId, {
      name: newServerName.trim(),
      url: newServerUrl.trim(),
    });
    setServers(getSavedServers());
    setEditingId(null);
    setNewServerName("");
    setNewServerUrl("");
    setError("");
  };

  const handleDeleteServer = (serverId: string) => {
    if (servers.length <= 1) {
      setError("You must have at least one server");
      return;
    }
    deleteServer(serverId);
    setServers(getSavedServers());
  };

  const handleStartEdit = (server: ServerEndpoint) => {
    setEditingId(server.id);
    setNewServerName(server.name);
    setNewServerUrl(server.url);
    setIsAdding(false);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setNewServerName("");
    setNewServerUrl("");
    setError("");
  };

  const handleToggleForceOffline = () => {
    const newValue = !forceOffline;
    setForceOfflineMode(newValue);
    setForceOfflineLocal(newValue);
    // Reload page to apply offline mode
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Manage Servers
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {/* Force Offline Mode */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WifiOff className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Force Offline Mode
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Disable API connection and use offline mode
                    </p>
                  </div>
                </div>
                <Switch
                  checked={forceOffline}
                  onCheckedChange={handleToggleForceOffline}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Server List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80">
                API Endpoints
              </h3>

              {servers.map((server) => (
                <div
                  key={server.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    server.isActive
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {editingId === server.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-white/60">Name</Label>
                        <Input
                          value={newServerName}
                          onChange={(e) => setNewServerName(e.target.value)}
                          placeholder="My Server"
                          className="mt-1 bg-white/5 border-white/20"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-white/60">URL</Label>
                        <Input
                          value={newServerUrl}
                          onChange={(e) => setNewServerUrl(e.target.value)}
                          placeholder="http://localhost:3000"
                          className="mt-1 bg-white/5 border-white/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateServer(server.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">
                            {server.name}
                          </h4>
                          {server.isActive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full text-xs text-blue-300">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 truncate">
                          {server.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {!server.isActive && (
                          <button
                            onClick={() => handleSetActive(server.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                            title="Set as active"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(server)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {servers.length > 1 && (
                          <button
                            onClick={() => handleDeleteServer(server.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-white/60 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Server */}
              {isAdding ? (
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                  <div>
                    <Label className="text-xs text-white/60">Name</Label>
                    <Input
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      placeholder="My Server"
                      className="mt-1 bg-white/5 border-white/20"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60">URL</Label>
                    <Input
                      value={newServerUrl}
                      onChange={(e) => setNewServerUrl(e.target.value)}
                      placeholder="http://192.168.1.100:3000"
                      className="mt-1 bg-white/5 border-white/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddServer}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Add Server
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setEditingId(null);
                    setError("");
                  }}
                  className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-white/60 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Server</span>
                </button>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-white/40 space-y-1">
              <p>• Switching servers will reload the application</p>
              <p>• Force offline mode disables all API connections</p>
              <p>• Downloaded content remains available offline</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
