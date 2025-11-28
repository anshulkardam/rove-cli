import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { prisma } from "../../lib/db";
import chalk from "chalk";
import { AIService } from "../services/google-service";
import { ChatService } from "../../services/chat";
import { intro, isCancel, outro, text } from "@clack/prompts";
import boxen from "boxen";
import { getStoredToken } from "../../lib/token";
import yoctoSpinner from "yocto-spinner";
import { Message } from "../../generated/prisma/client";

marked.use({
  renderer: new TerminalRenderer({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  }),
});

const aiService = new AIService();

const chatService = new ChatService();

export async function startChat({
  mode,
  conversationId,
}: {
  mode: string;
  conversationId: string;
}) {
  try {
    intro(
      boxen(chalk.bold.cyan("Rove AI Chat"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();
    const conversation = await initConversation({
      userId: user.id,
      conversationId,
      mode,
    });

    await chatLoop(conversation);

    outro(chalk.green("Thanks for chatting"));
  } catch (error: any) {
    const errorBox = boxen(chalk.red(` Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });

    console.log(errorBox);
  }
}

async function getUserFromToken() {
  const token = await getStoredToken();

  if (!token?.access_token) {
    throw new Error("Not authenticated. Please login first");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found. please login again.");
  }

  spinner.success(`Welcome Back, ${user.name}!`);

  return user;
}

async function initConversation({
  userId,
  conversationId,
  mode,
}: {
  userId: string;
  conversationId: string;
  mode: string;
}) {
  const spinner = yoctoSpinner({ text: "Loading Conversation..." }).start();

  const conversation = await chatService.getConversation({
    userId,
    conversationId,
    mode,
  });

  if (!conversation) {
    throw new Error("Conversation not found!");
  }

  spinner.success("Conversation Loaded!");

  const convoBox = boxen(
    `${chalk.bold("Conversation")} : ${conversation.title}\n${chalk.gray(
      "ID: " + conversation.id
    )}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "Chat Session",
      titleAlignment: "center",
    }
  );

  console.log(convoBox);

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("Previous messages: \n"));
    displayMessages({ messages: conversation.messages });
  }

  return conversation;
}

async function displayMessages({ messages }: { messages: Message[] }) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "You",
        titleAlignment: "left",
      });

      console.log(userBox);
    } else {
      const renderedContent = marked.parse(msg.content);

      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "Assistant",
        titleAlignment: "left",
      });

      console.log(assistantBox);
    }
  });
}

async function saveMessage({
  conversationId,
  role,
  content,
}: {
  conversationId: string;
  role: string;
  content: string;
}) {
  return await chatService.addMessage({ content, conversationId, role });
}

async function updateConversationTitle({
  conversationId,
  userInput,
  messageCount,
}: {
  conversationId: string;
  userInput: string;
  messageCount: number;
}) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");

    await chatService.updateTitle({ conversationId, title });
  }
}

async function chatLoop(conversation: any) {
  const helpBox = boxen(
    `${chalk.gray("Type your message and press Enter")}\n${chalk.gray(
      "Markdown formatting is supported in responses"
    )}\n${chalk.gray("Type 'exit' to end conversation")}\n${chalk.gray(
      "Press Ctrl+C to quit anytime"
    )}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderColor: "gray",
      borderStyle: "round",
      dimBorder: true,
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("Your Message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat Session ended. Goodbye!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });

      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat Session ended. Goodbye!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });

      console.log(exitBox);
      break;
    }

    await saveMessage({
      conversationId: conversation.id,
      role: "user",
      content: userInput,
    });

    const messages = await chatService.getMessages({
      conversationId: conversation.id,
    });

    const aiResponse = await getAIresponse({ conversationId: conversation.id });

    await saveMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: aiResponse,
    });

    await updateConversationTitle({
      conversationId: conversation.id,
      messageCount: messages.length,
      userInput,
    });
  }
}

async function getAIresponse({ conversationId }: { conversationId: string }) {
  const spinner = yoctoSpinner({
    text: "AI is thinking...",
    color: "cyan",
  }).start();

  const dbMessages = await chatService.getMessages({ conversationId });

  //   const aiMessages = chatService.formatMessagesForAI({ messages: dbMessages });

  let fullResponse = "";
  let isfirstChunk = true;

  try {
    const result = await aiService.sendMessage({
      message: dbMessages,
      onChunk: (chunk) => {
        if (isfirstChunk) {
          spinner.stop();
          console.log("\n");
          const header = chalk.green.bold("Assistant: ");
          console.log(header);
          console.log(chalk.gray("-".repeat(60)));
          isfirstChunk = false;
        }
        fullResponse += chunk;
      },
    });

    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(60)));
    console.log("\n");

    return result.content;
  } catch (error) {
    spinner.error("Failed to get AI response");
    throw error;
  }
}
