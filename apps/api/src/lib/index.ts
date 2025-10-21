// Middleware exports
export {
  setupMiddleware,
  setupErrorHandling,
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from "./middleware";

// Config exports
export { setupRoutes, swaggerUi, specs } from "./config";

// Database exports
export { prisma } from "./database";

// Utils exports
export * from "./utils";
