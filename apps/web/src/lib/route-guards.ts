/**
 * Route Guards for Role-Based Access Control
 *
 * Use these guards in route definitions to protect routes at the router level
 * instead of checking authorization in components.
 */

// Temporarily disabled imports due to auth bypass
// import { redirect } from "@tanstack/react-router";
// import { authClient } from "./auth-client";
// import { getActiveServer, getForceOfflineMode } from "./server-storage";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER" | "GUEST";

// Temporarily disabled functions due to auth bypass
/*
async function isApiReachable(): Promise<boolean> {
  try {
    // Check if force offline mode is enabled
    const forceOffline = getForceOfflineMode();
    if (forceOffline) {
      return false;
    }

    // Get active server from localStorage
    const activeServer = getActiveServer();
    if (!activeServer) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Short timeout for route guards

    const response = await fetch(`${activeServer.url}/api/v1/health`, {
      method: "GET",
      signal: controller.signal,
      credentials: "omit",
    });

    clearTimeout(timeoutId);
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function getCurrentSession() {
  try {
    const response = await authClient.getSession();
    return response.data;
  } catch {
    return null;
  }
}
*/

/**
 * Require authentication - redirect to login if not authenticated
 * TEMPORARILY DISABLED - All auth checks bypassed
 */
export async function requireAuth() {
  // TEMPORARY: Always bypass authentication - return mock user
  return {
    user: {
      id: "temp-user",
      name: "Temporary User",
      email: "temp@local",
      role: "ADMIN", // Give admin role for full access
    },
    session: null,
  };

  // Original code commented out for temporary disable
  /*
  // Check if API is reachable first
  const apiOnline = await isApiReachable();

  // Skip auth check when API is offline
  if (!apiOnline) {
    return {
      user: {
        id: "offline-user",
        name: "Offline User",
        email: "offline@local",
        role: "USER",
      },
      session: null,
    };
  }

  const session = await getCurrentSession();

  if (!session?.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: window.location.pathname,
      },
    });
  }

  return session;
  */
}

/**
 * Require specific role(s) - shows error or redirects if unauthorized
 * TEMPORARILY DISABLED - All role checks bypassed
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param redirectOnFail - If true, redirects to home. If false, lets component show access denied.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireRole(..._args: [UserRole[], boolean?]) {
  // TEMPORARY: Always allow access - bypass all role checks
  return true;

  // Original code commented out for temporary disable
  /*
  // Check if API is reachable first
  const apiOnline = await isApiReachable();

  // In offline mode, allow basic user access but block admin-only routes
  if (!apiOnline) {
    // Block admin/super admin routes in offline mode
    if (allowedRoles.every((role) => ["ADMIN", "SUPER_ADMIN"].includes(role))) {
      if (redirectOnFail) {
        throw redirect({
          to: "/",
          search: {
            error: "offline_admin_disabled",
          },
        });
      }
      return false;
    }
    // Allow user-level access
    return true;
  }

  const session = await requireAuth();

  const userRole = (session.user as unknown as { role?: UserRole }).role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (redirectOnFail) {
      throw redirect({
        to: "/",
        search: {
          error: "insufficient_permissions",
        },
      });
    }
    // Return false to let component handle the UI (show access denied message)
    return false;
  }

  return true;
  */
}

/**
 * Require admin role (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin(redirectOnFail = false) {
  return requireRole(["ADMIN", "SUPER_ADMIN"], redirectOnFail);
}

/**
 * Require super admin role only
 */
export async function requireSuperAdmin(redirectOnFail = false) {
  return requireRole(["SUPER_ADMIN"], redirectOnFail);
}

/**
 * Require user role or higher (USER, ADMIN, or SUPER_ADMIN)
 */
export async function requireUser(redirectOnFail = false) {
  return requireRole(["USER", "ADMIN", "SUPER_ADMIN"], redirectOnFail);
}

/**
 * Block guests - require any authenticated role except GUEST
 * TEMPORARILY DISABLED - All guest checks bypassed
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function blockGuests(_redirectOnFail = true) {
  // TEMPORARY: Always allow access - bypass guest checks
  return true;

  // Original code commented out for temporary disable
  /*
  const session = await requireAuth();
  const userRole = (session.user as unknown as { role?: UserRole }).role;

  if (userRole === "GUEST") {
    if (redirectOnFail) {
      throw redirect({
        to: "/",
        search: {
          error: "guest_not_allowed",
        },
      });
    }
    return false;
  }

  return true;
  */
}
