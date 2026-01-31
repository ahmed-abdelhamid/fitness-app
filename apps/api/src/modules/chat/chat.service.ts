import { PrismaService } from "@/prisma/prisma.service.js";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify user has access to a conversation
   */
  async verifyConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignment: { select: { userId: true, coachId: true, status: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // Check if user is part of this conversation
    const isParticipant =
      conversation.assignment.userId === userId ||
      conversation.assignment.coachId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    return true;
  }

  /**
   * Get conversation by ID with participants
   */
  async getConversation(conversationId: string, userId: string) {
    await this.verifyConversationAccess(conversationId, userId);

    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    params: { take?: number; cursor?: string },
  ) {
    await this.verifyConversationAccess(conversationId, userId);

    const { take = 50, cursor } = params;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: take + 1, // Get one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: { sentAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const hasMore = messages.length > take;
    const data = hasMore ? messages.slice(0, take) : messages;

    return {
      data,
      meta: {
        hasMore,
        nextCursor: hasMore ? data[data.length - 1]?.id : null,
      },
    };
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.verifyConversationAccess(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            assignment: {
              select: {
                userId: true,
                coachId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // Verify user is part of this conversation
    const isParticipant =
      message.conversation.assignment.userId === userId ||
      message.conversation.assignment.coachId === userId;

    if (!isParticipant) {
      throw new ForbiddenException("You do not have access to this message");
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return message;
    }

    // Only mark as read if not already read
    if (!message.readAt) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return message;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAllAsRead(conversationId: string, userId: string) {
    await this.verifyConversationAccess(conversationId, userId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Don't mark own messages
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    // Get all conversations the user is part of
    const assignments = await this.prisma.assignment.findMany({
      where: {
        OR: [{ userId }, { coachId: userId }],
        status: "ACTIVE",
      },
      include: {
        conversation: {
          select: { id: true },
        },
      },
    });

    const conversationIds = assignments
      .map((a) => a.conversation?.id)
      .filter(Boolean) as string[];

    if (conversationIds.length === 0) {
      return { count: 0 };
    }

    const count = await this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        readAt: null,
      },
    });

    return { count };
  }

  /**
   * Get the other participant in a conversation
   */
  async getOtherParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignment: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            coach: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    return conversation.assignment.userId === userId
      ? conversation.assignment.coach
      : conversation.assignment.user;
  }
}
