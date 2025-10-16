/**
 * Server Storage Management
 * Manages API endpoints in localStorage
 */

export interface ServerEndpoint {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

const SERVERS_KEY = "dester_servers";
const FORCE_OFFLINE_KEY = "dester_force_offline";

/**
 * Get all saved servers from localStorage
 */
export function getSavedServers(): ServerEndpoint[] {
  try {
    const stored = localStorage.getItem(SERVERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading servers:", error);
  }

  // Return default server if none exist
  const defaultServer: ServerEndpoint = {
    id: "default",
    name: "Local Server",
    url: "http://localhost:3000",
    isActive: true,
  };

  saveServers([defaultServer]);
  return [defaultServer];
}

/**
 * Save servers to localStorage
 */
export function saveServers(servers: ServerEndpoint[]): void {
  try {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error("Error saving servers:", error);
  }
}

/**
 * Get the currently active server
 */
export function getActiveServer(): ServerEndpoint | null {
  const servers = getSavedServers();
  return servers.find((s) => s.isActive) || servers[0] || null;
}

/**
 * Set a server as active
 */
export function setActiveServer(serverId: string): void {
  const servers = getSavedServers();
  const updatedServers = servers.map((server) => ({
    ...server,
    isActive: server.id === serverId,
  }));
  saveServers(updatedServers);
}

/**
 * Add a new server
 */
export function addServer(name: string, url: string): ServerEndpoint {
  const servers = getSavedServers();
  const newServer: ServerEndpoint = {
    id: `server-${Date.now()}`,
    name,
    url: url.replace(/\/$/, ""), // Remove trailing slash
    isActive: false,
  };

  servers.push(newServer);
  saveServers(servers);
  return newServer;
}

/**
 * Update an existing server
 */
export function updateServer(
  serverId: string,
  updates: Partial<Omit<ServerEndpoint, "id">>
): void {
  const servers = getSavedServers();
  const updatedServers = servers.map((server) =>
    server.id === serverId ? { ...server, ...updates } : server
  );
  saveServers(updatedServers);
}

/**
 * Delete a server
 */
export function deleteServer(serverId: string): void {
  const servers = getSavedServers();
  const filteredServers = servers.filter((s) => s.id !== serverId);

  // If we deleted the active server, make the first one active
  if (
    servers.find((s) => s.id === serverId)?.isActive &&
    filteredServers.length > 0
  ) {
    filteredServers[0].isActive = true;
  }

  saveServers(filteredServers);
}

/**
 * Get force offline mode status
 */
export function getForceOfflineMode(): boolean {
  try {
    return localStorage.getItem(FORCE_OFFLINE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Set force offline mode
 */
export function setForceOfflineMode(enabled: boolean): void {
  try {
    localStorage.setItem(FORCE_OFFLINE_KEY, enabled.toString());
  } catch (error) {
    console.error("Error setting force offline mode:", error);
  }
}
