import { Request, Response, NextFunction } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { logger } from "@dester/logger";

function getApiVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../../../package.json"), "utf-8")
    );
    return packageJson.version;
  } catch (error) {
    return "unknown";
  }
}

function parseVersion(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function isVersionCompatible(
  clientVersion: string,
  apiVersion: string
): boolean {
  const client = parseVersion(clientVersion);
  const api = parseVersion(apiVersion);

  if (!client || !api) return false;
  if (client.major !== api.major) return false;
  if (client.minor !== api.minor) return false;
  return true;
}

export function validateVersion(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientVersion = req.headers["x-client-version"] as string;
  const apiVersion = getApiVersion();

  if (!clientVersion) {
    logger.warn("No client version provided in request headers");
    next();
    return;
  }

  if (!isVersionCompatible(clientVersion, apiVersion)) {
    logger.warn(
      `Version mismatch: Client version ${clientVersion} is not compatible with API version ${apiVersion}`
    );
    res.status(426).json({
      success: false,
      error: "Version mismatch",
      message: `Client version ${clientVersion} is not compatible with API version ${apiVersion}. Please update your client.`,
      data: {
        clientVersion,
        apiVersion,
        upgradeRequired: true,
      },
    });
    return;
  }

  next();
}

export function addVersionHeader(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiVersion = getApiVersion();
  res.setHeader("X-API-Version", apiVersion);
  next();
}
