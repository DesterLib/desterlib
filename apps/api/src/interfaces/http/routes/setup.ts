import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../swagger/swagger.config";
import baseRoutes from "./index";
import v1Routes from "./v1";

// Get API version for request interceptor
function getApiVersion(): string {
  return (swaggerSpec as any).info?.version || "0.3.0";
}

export function setupRoutes(app: Application) {
  // Get API version at setup time (server-side)
  const apiVersion = getApiVersion();

  // Create request interceptor with version embedded as string literal
  // This function will be serialized and sent to the browser, so we need to embed the value
  const requestInterceptor = new Function(
    "request",
    `
    // Auto-add X-Client-Version header if not already set
    if (!request.headers["X-Client-Version"]) {
      request.headers["X-Client-Version"] = "${apiVersion}";
    }
    return request;
  `
  );

  // Swagger documentation
  // Using null as first arg and url in swaggerOptions to fetch spec via network request
  // This allows you to see the network request in dev tools
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "DesterLib API Documentation",
      swaggerOptions: {
        url: "/api/docs.json", // Fetch spec via network request instead of embedding
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        requestInterceptor: requestInterceptor as any,
      },
    })
  );

  // Swagger JSON endpoint
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Base routes (health check, etc.)
  app.use("/", baseRoutes);

  // API v1 routes
  app.use("/api/v1", v1Routes);
}
