import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";
import { prisma } from "../../../lib/db";
import { select } from "@clack/prompts";
import { getStoredToken } from "../../../lib/token";
import { Command } from "commander";
import { startChat } from "../../chat";

const startAction = async () => {
  const token = await getStoredToken();

  if (!token?.access_token) {
    console.log(chalk.red("Not Authenticated, Please Login"));
    return;
  }

  const spinner = yoctoSpinner({ text: "Fetching User Information..." });
  spinner.start();

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

  spinner.stop();

  if (!user) {
    console.log(chalk.red("User Not Found"));
    return;
  }

  console.log(chalk.green(`Welcome Back, ${user.name}! \n`));

  const choices = await select({
    message: "Select an Option:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Chat with Rove AI",
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced Rove AI Agent",
      },
    ],
  });

  switch (choices) {
    case "chat":
      startChat({ mode: "chat", conversationId: "" });
      break;
    case "tool":
      console.log(chalk.green("Tool Calling is selected"));
      break;
    case "agent":
      console.log(chalk.green("Agentic Mode is selected"));
      break;
  }
};

export const start = new Command("start")
  .description("Start the rove ai")
  .action(startAction);
