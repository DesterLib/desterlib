import axios from "axios";

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + (config.url || "");
    console.log("Axios request URL:", fullUrl);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error("Network Error - API server may not be running:", {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || "") + (error.config?.url || ""),
      });

      if (import.meta.env.DEV) {
        console.error("Make sure the API server is running on port 3001");
      }
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);
