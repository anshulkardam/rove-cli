import { Conversation, Message } from "../generated/prisma/client";
import { prisma } from "../lib/db";

export class ChatService {
  async createConversation({
    userId,
    mode = "chat",
    title,
  }: {
    userId: string;
    mode: string;
    title?: string;
  }): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} conversation`,
      },
    });
  }

  async getConversation({
    userId,
    conversationId,
    mode = "chat",
  }: {
    userId: string;
    conversationId: string;
    mode: string;
  }): Promise<(Conversation & { messages: Message[] }) | null> {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (conversation) return conversation;
    }

    const newConversation = await this.createConversation({ userId, mode });
    return { ...newConversation, messages: [] };
  }

  async addMessage({
    conversationId,
    role,
    content,
  }: {
    conversationId: string;
    role: string;
    content: any;
  }) {
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }

  async getMessages({ conversationId }: { conversationId: string }) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const parsedMessages = await Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        content: await this.parseContent({ content: msg.content }),
      }))
    );
    return parsedMessages;
  }

  async getUserConversation({ userId }: { userId: string }) {
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async deleteUserConversation({
    userId,
    conversationId,
  }: {
    userId: string;
    conversationId: string;
  }) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  async updateTitle({
    conversationId,
    title,
  }: {
    title: string;
    conversationId: string;
  }) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async parseContent({ content }: { content: any }) {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  // async formatMessagesForAI({ messages }: { messages: Message[] }) {
  //   return messages.map((msg) => ({
  //     role: msg.role,
  //     content:
  //       typeof msg.content === "string"
  //         ? msg.content
  //         : JSON.stringify(msg.content),
  //   }));
  // }
}
