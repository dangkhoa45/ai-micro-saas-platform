import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

/**
 * NextAuth configuration
 * Supports credentials (email/password) and OAuth (Google, GitHub)
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email || "",
          name: user.name,
          image: user.image,
        };
      },
    }),
    // OAuth providers are conditionally enabled only when configured
    // This prevents runtime errors like "client_id is required"
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : (() => {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[auth] Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"
            );
          }
          return [] as const;
        })()),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : (() => {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[auth] GitHub OAuth disabled: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local"
            );
          }
          return [] as const;
        })()),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/signin",
    // optional custom pages below (only if implemented)
    // signOut: "/auth/signout",
    // error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Honor explicit callbackUrl if it's same-origin
      try {
        const u = new URL(url, baseUrl);
        const cb = u.searchParams.get("callbackUrl");
        if (cb) {
          const dest = new URL(cb, baseUrl);
          if (dest.origin === baseUrl) return dest.toString();
        }

        // Avoid redirecting back to the sign-in page after OAuth; send to dashboard
        if (u.pathname.startsWith("/auth/signin")) {
          return `${baseUrl}/dashboard`;
        }

        // Allow relative and same-origin URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        if (u.origin === baseUrl) return u.toString();
      } catch (e) {
        // fallthrough on parse errors
      }
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
