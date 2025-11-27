import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import config from "../config";
import { deviceAuthorization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/api/auth",
  trustedOrigins: [
    "http://localhost:3000", // frontend
    "http://localhost:4000", // backend (Better Auth server)
  ],
  socialProviders: {
    github: {
      clientId: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    deviceAuthorization({
      // Optional configuration
      expiresIn: "30m", // Device code expiration time
      interval: "5s", // Minimum polling interval
    }),
  ],
});
