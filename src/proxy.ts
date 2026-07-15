import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

// Get the NextAuth handler function
const authHandler = NextAuth(authConfig).auth;

// In Next.js 16, proxy.ts replaces middleware.ts and exports named "proxy"
export { authHandler as proxy };

export const config = {
  // Protect the dashboard path and any nested sub-routes
  matcher: ["/dashboard/:path*"],
};
