import axios from "axios";

// In development, use the Vite proxy to avoid CORS issues
// In production, use the full API URL
const API_BASE_URL = import.meta.env.DEV
  ? "" // Use relative URLs in dev to leverage Vite proxy
  : import.meta.env.VITE_API_URL || "http://localhost:3001";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Enable credentials for CORS
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    console.log("Axios request URL:", config.baseURL + (config.url || ""));
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);
