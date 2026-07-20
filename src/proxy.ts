import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "archit-jwt-secret-key-123456789-987654321";

// Get the NextAuth handler function with explicit secret
const authHandler = NextAuth({
  ...authConfig,
  secret,
}).auth;

// In Next.js 16, proxy.ts replaces middleware.ts and exports named "proxy"
export { authHandler as proxy };

export const config = {
  // Protect the dashboard path and any nested sub-routes
  matcher: ["/dashboard/:path*"],
};
