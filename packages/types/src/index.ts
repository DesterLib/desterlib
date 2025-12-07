// Shared types across all services

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Event naming conventions
export type EventChannel =
  | `scanner:${string}`
  | `metadata:${string}`
  | `api:${string}`;

// Plugin system types
export type { IPlugin, PluginConfig, PluginStatus } from "./plugin.interface";
