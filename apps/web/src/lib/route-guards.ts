/**
 * Route Guards for Role-Based Access Control
 *
 * Use these guards in route definitions to protect routes at the router level
 * instead of checking authorization in components.
 */

import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER" | "GUEST";

/**
 * Get current session from auth client
 * This can be called in beforeLoad since it's not a React hook
 */
async function getCurrentSession() {
  try {
    const response = await authClient.getSession();
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
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
}

/**
 * Require specific role(s) - shows error or redirects if unauthorized
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param redirectOnFail - If true, redirects to home. If false, lets component show access denied.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectOnFail = false
) {
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
 */
export async function blockGuests(redirectOnFail = true) {
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
}
