import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import chalk from "chalk";
import config from "../../config";
import { Message } from "../../generated/prisma/client";

export class AIService {
  model: any;

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is undefined");
    }
    this.model = google(config.GEMINI_MODEL!);
  }

  async sendMessage({
    message,
    onChunk,
    tools,
    onToolCall,
  }: {
    message: Message[];
    onChunk?: (chunk: string) => void;
    tools?: any;
    onToolCall?: any;
  }): Promise<{ content: string; finishReason: string; usage: any }> {
    try {
      // Transform Prisma Message[] to ModelMessage[]
      const modelMessages = message.map((msg) => ({
        role: msg.role as "user" | "assistant", // adjust as needed
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      }));
      const streamConfig = {
        model: this.model,
        messages: modelMessages,
        temperature: 0.2,
        tools,
        onToolCall,
      };
      const result = await streamText(streamConfig);
      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }
      // finishReason is likely a string, but fallback to String()
      return {
        content: fullResponse,
        finishReason: typeof result.finishReason === "string" ? result.finishReason : String(result.finishReason),
        usage: result.usage,
      };
    } catch (error: any) {
      console.error(chalk.red("AI Service Error: "), error.message);
      throw error;
    }
  }

  async getMessage(messages: Message[], tools?: any): Promise<string> {
    let fullResponse = "";
    await this.sendMessage({
      message: messages,
      onChunk: (chunk: string) => {
        fullResponse += chunk;
      },
      tools,
    });
    return fullResponse;
  }
}
