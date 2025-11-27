import "dotenv/config";

const config = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "DEVELOPMENT",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
};

export default config;
