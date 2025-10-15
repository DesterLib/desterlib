import { configure } from "@dester/api-client";

// Configure the API client
configure({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});
