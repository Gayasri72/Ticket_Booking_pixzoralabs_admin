import { auth as middlewareAuth } from "@/auth";

/**
 * Re-export auth for use in API routes
 * In Next.js 16 with Auth.js v5, this should automatically have access to session context
 */
export const auth = middlewareAuth;

export default middlewareAuth;
