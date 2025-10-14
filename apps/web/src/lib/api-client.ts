import { DesterClient } from "@dester/api-client";

// Create a singleton instance of the API client
export const apiClient = new DesterClient({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
});
