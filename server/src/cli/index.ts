#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import { login, logout, whoami } from "./commands/auth/login";

async function main() {
  console.log(
    chalk.redBright(
      figlet.textSync("ROVE CLI", {
        font: "Standard",
        horizontalLayout: "default",
      })
    )
  );

  console.log(chalk.bgCyanBright("A cli based AI tool \n"));

  const program = new Command("rove");

  program
    .version("0.0.2")
    .description("Rove CLI - A CLI Based AI Tool")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.log(chalk.red("Error running rove cli: "), err);
  process.exit(1);
});
