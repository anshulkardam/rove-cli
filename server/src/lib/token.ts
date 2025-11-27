import chalk from "chalk";
import { CONFIG_DIR, TOKEN_FILE } from "../cli/commands/auth/login";
import fs from "fs/promises";

export interface StoredToken {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string | null;
  created_at?: string;
}

export async function getStoredToken(): Promise<StoredToken | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data) as StoredToken;
    return token;
  } catch (error) {
    return null;
  }
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_in?: number | null;
};

export async function storeToken(token: TokenResponse): Promise<boolean> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    const tokenData: StoredToken = {
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      token_type: token.token_type || "Bearer",
      scope: token.scope ?? null,
      expires_at: token.expires_in
        ? new Date(Date.now() + (token.expires_in ?? 0) * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Failed to store token: "), (error as Error).message);

    return false;
  }
}

export async function clearStoredToken(): Promise<boolean> {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch (error) {
    return false;
  }
}

export async function isTokenExpired(): Promise<boolean> {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

export async function requireAuth(): Promise<StoredToken> {
  const token = await getStoredToken();

  if (!token) {
    console.log(
      chalk.red("Not Authenticated. Please run 'your-cli login' first")
    );
    process.exit(1);
  }

  if (await isTokenExpired()) {
    console.log(chalk.yellow("Your session has expired, Please login again."));
    console.log(chalk.gray("Run: your-cli login \n"));
    process.exit(1);
  }

  return token;
}
