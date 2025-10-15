import { configure } from "@dester/api-client";

// Configure the API client
configure({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Fetch CSRF token on app initialization
fetch("http://localhost:3000/api/v1/csrf-token", {
  credentials: "include",
}).catch(() => {
  // Ignore errors on initial CSRF fetch
});
