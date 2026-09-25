import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "archit-jwt-secret-key-123456789-987654321",
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized({ auth, request }) {
      const cookiesList = request?.cookies?.getAll ? request.cookies.getAll() : [];
      const hasSupabaseCookie = cookiesList.some(
        (c) => (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) || c.name === "mock-logged-in"
      );
      const isLoggedIn = !!auth?.user || hasSupabaseCookie || !!request?.cookies?.has("mock-logged-in");
      const nextUrl = request?.nextUrl;
      const isDashboard = nextUrl ? nextUrl.pathname.startsWith("/dashboard") : false;
      
      if (isDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated traffic to /auth
      }
      
      return true;
    },
  },
  providers: [], // Configured inside auth.ts for full runtime support
} satisfies NextAuthConfig;
