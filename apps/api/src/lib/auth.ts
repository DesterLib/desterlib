import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { env } from "../config/env.js";
import type { Request, Response } from "express";

// Ensure fetch globals are available
const { Headers, Request: WebRequest } = globalThis;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 4, // Allow PINs (4-6 digits)
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  baseURL: env.APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3000",
    env.APP_URL || "http://localhost:3000",
  ],
  onAfterSignUp: async (user: { user: { id: string } }) => {
    // Check if this is the first user - make them admin
    const userCount = await prisma.user.count();
    if (userCount === 1) {
      // This is the first user
      await prisma.user.update({
        where: { id: user.user.id },
        data: { role: "ADMIN" },
      });
    }
  },
});

export const authHandler = async (req: Request, res: Response) => {
  // Convert Express request to Web Request with full URL
  const protocol = req.protocol;
  const host = req.get("host") || "localhost:3000";
  const url = `${protocol}://${host}${req.originalUrl}`;

  // Create a proper Web Request
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  });

  const webRequest = new WebRequest(url, {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
  });

  const response = await auth.handler(webRequest);

  // Convert Web Response to Express response
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.status(response.status);

  const body = await response.text();
  if (body) {
    res.send(body);
  } else {
    res.end();
  }
};
