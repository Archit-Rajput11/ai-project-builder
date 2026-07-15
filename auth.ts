import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "github-client-id-placeholder",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "github-client-secret-placeholder",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email Address", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Validation logic for credentials auth (requires valid email and >= 8 character password)
        if (email.includes("@") && password.length >= 8) {
          return {
            id: "1",
            name: "Alex Mercer",
            email: email,
          };
        }

        return null;
      },
    }),
  ],
});
