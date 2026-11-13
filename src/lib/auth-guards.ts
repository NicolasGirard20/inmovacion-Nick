import { auth } from "../../auth";

/**
 * Retrieves the current authenticated session if a user ID is present.
 */
export async function getAuthenticatedSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

/**
 * Retrieves the current session only when the authenticated user has the admin role.
 */
export async function getAdminSession() {
  const session = await getAuthenticatedSession();
  if (session?.user?.role !== "admin") {
    return null;
  }
  return session;
}

/**
 * Returns a standard 401 JSON response for unauthenticated API requests.
 */
export function unauthorizedResponse(message = "No autenticado") {
  return Response.json({ error: message }, { status: 401 });
}

/**
 * Returns a standard 403 JSON response for unauthorized API requests.
 */
export function forbiddenResponse(message = "No autorizado") {
  return Response.json({ error: message }, { status: 403 });
}
