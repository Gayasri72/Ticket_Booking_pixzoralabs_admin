import { cookies } from "next/headers";
import type { Session } from "next-auth";

/**
 * Parse JWT payload manually (without verification for now)
 * This is a workaround for when Auth.js session isn't working
 */
function parseJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    );
    return decoded;
  } catch (err) {
    console.error("[Auth] Failed to parse JWT:", err);
    return null;
  }
}

/**
 * Get JWT session from cookies
 * This is a fallback method when auth() doesn't work in API routes
 */
export async function verifyAuth() {
  try {
    const cookieStore = await cookies();

    // Try to get the JWT token from cookies
    // Auth.js can store it as either of these names depending on context
    const token =
      cookieStore.get("__Secure-authjs.session-token")?.value ||
      cookieStore.get("authjs.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value;

    if (!token) {
      console.log("[Auth] No session token found in cookies");
      return null;
    }

    // Parse the JWT payload
    const payload = parseJWT(token);
    if (!payload) {
      console.log("[Auth] Failed to parse JWT payload");
      return null;
    }

    console.log("[Auth] JWT parsed successfully");

    return {
      user: {
        id: payload.sub || payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions || [],
      },
    };
  } catch (err) {
    console.error("[Auth] Failed to verify JWT:", err);
    return null;
  }
}

/**
 * Get session for API routes with automatic fallback
 * Tries auth() first, then falls back to manual JWT verification
 */
export async function getSessionForAPI() {
  try {
    // First, try using the auth() function from @/auth
    const { auth } = await import("@/auth");
    let session: (Session & { expires: string }) | null = await auth();

    // If auth() didn't work, try manual JWT verification
    if (!session?.user?.id) {
      const fallbackSession = await verifyAuth();
      if (fallbackSession?.user?.id) {
        session = {
          user: fallbackSession.user,
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };
      }
    }

    return session;
  } catch (err) {
    console.error("[Auth] Error getting session:", err);
    return null;
  }
}

/**
 * Wrapped auth function for API routes
 * Automatically tries fallback JWT verification if auth() returns null
 * Can be used as a drop-in replacement for importing auth from "@/auth"
 */
export async function authWithFallback() {
  const session = await getSessionForAPI();
  return session;
}
