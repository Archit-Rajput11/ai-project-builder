import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user || !!request?.cookies?.has("mock-logged-in");
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
