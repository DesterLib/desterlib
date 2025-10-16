import { configure } from "@dester/api-client";
import { getActiveServer } from "./server-storage";

// Get the active server from localStorage
const activeServer = getActiveServer();
const baseURL =
  activeServer?.url || import.meta.env.VITE_API_URL || "http://localhost:3000";

// Configure the API client
configure({
  baseURL,
});

// Fetch CSRF token on app initialization
fetch(`${baseURL}/api/v1/csrf-token`, {
  credentials: "include",
}).catch(() => {
  // Ignore errors on initial CSRF fetch
});
