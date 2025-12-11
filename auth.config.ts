import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

// Type augmentation for Auth.js
declare module "next-auth" {
  interface User {
    role?: string;
    permissions?: string[];
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      permissions?: string[];
    };
  }
  interface JWT {
    role?: string;
    permissions?: string[];
  }
}

export default {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            userPermissions: {
              include: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("User account is inactive");
        }

        const passwordMatch = await compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        // Only allow ADMIN and SUPER_ADMIN to login to admin dashboard
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          throw new Error("Insufficient permissions");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.userPermissions.map((up) => up.permission.name),
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // When user logs in, add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.permissions = user.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string | undefined;
        session.user.permissions =
          (token.permissions as string[] | undefined) || [];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
} satisfies NextAuthConfig;
