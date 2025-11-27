import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import path from "path";
import open from "open";
import os from "os";
import yocto from "yocto-spinner";
import { Command } from "commander";
import z from "zod/v4";
import { prisma } from "../../../lib/db";
import config from "../../../config";
import {
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
  requireAuth,
  storeToken,
} from "../../../lib/token";

const URL = "http://localhost:4000";
const clientID = config.GITHUB_CLIENT_ID;

export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts: {
  serverUrl?: string;
  clientId?: string;
}) {
  const schema = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const parsed = schema.parse(opts || {});

  const serverUrl: string = parsed.serverUrl || URL;
  const clientId: string = parsed.clientId || clientID;

  intro(chalk.bold("Auth CLI Login"));

  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Do you want to login again?",
      initialValue: false,
    });
    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login Cancelled");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yocto({ text: "Requesting device authorization..." });

  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    spinner.stop();

    if (error || !data) {
      logger.error(
        `Failed to request device authorization : ${error.error_description}`
      );

      process.exit(1);
    }

    const {
      device_code,
      expires_in,
      interval,
      user_code,
      verification_uri,
      verification_uri_complete,
    } = data;

    console.log(chalk.cyan("Device Authorization Required"));

    console.log(
      `Please visit ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );

    console.log(`Enter Code: ${chalk.bold.green(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open Browser automatically",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri_complete || verification_uri;

      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )} minutes)... `
      )
    );

    const token = await pollforToken(
      authClient,
      device_code,
      clientId,
      interval
    );

    if (token) {
      const saved = await storeToken(token);

      if (!saved) {
        console.log(
          chalk.yellow("\n Warning: Could not save authentication token.")
        );
        console.log(
          chalk.yellow("\n You may need to login again on next use.")
        );
      }

      //const user = await prisma.user.findFirst; //TODO GET USER DATA

      outro(chalk.green("Login Successfull!"));

      console.log(
        chalk.gray("You can now use AI Commands without logging in again. \n")
      );
    }
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("\n Login Failed:"), (err as Error).message);
    process.exit(1);
  }
}

async function pollforToken(
  authClient: any,
  deviceCode: string,
  clientId: string,
  initialInterValue: number
): Promise<any> {
  let pollingInterval = initialInterValue;
  const spinner = yocto({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(
        `Polling for Authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
      );

      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": `My CLI`,
            },
          },
        });

        if (data?.access_token) {
          console.log("Authorization successful!");

          spinner.stop();

          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              // Continue polling
              break;
            case "slow_down":
              pollingInterval += 5;
              break;
            case "access_denied":
              console.error("Access was denied by the user");
              return;
            case "expired_token":
              console.error("The device code has expired. Please try again.");
              return;
            default:
              spinner.stop();
              logger.error(`Error: ${error.error_description}`);
              process.exit(1);
          }
        }
      } catch (err) {
        spinner.stop();
        logger.error(`Network error: ${(err as Error).message}`);
        process.exit(1);
      }

      setTimeout(poll, pollingInterval * 1000);
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold("Logout"));

  const token = await clearStoredToken();

  if (!token) {
    console.log(chalk.yellow("You are not logged in."));
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled");
    process.exit(0);
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.green("Successfully logged out"));
  } else {
    console.log(chalk.yellow("Could not clear token file"));
  }
}

export async function whoAmIAction(opts: { serverUrl?: string }) {
  const token = await requireAuth();

  if (!token.access_token) {
    console.log("No access token found. Please login.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  console.log(
    chalk.bold.greenBright(
      `\n User: ${user?.name} Email: ${user?.email} ID: ${user?.id}`
    )
  );
}

export const login = new Command("login")
  .description("login to better auth")
  .option("--server-url <url>", "The Better Auth server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", clientID)
  .action(loginAction);

export const logout = new Command("logout")
  .description("logout and clear stored credentials")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("show current authenticated user")
  .option("--server-url <url> ", "The Better Auth server URL", URL)
  .action(whoAmIAction);
