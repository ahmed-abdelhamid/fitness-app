import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Logger, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ChatService } from "./chat.service.js";
import { PrismaService } from "@/prisma/prisma.service.js";
import {
  type AuthenticatedSocket,
  createWsAuthMiddleware,
} from "./ws-auth.middleware.js";
import { SendMessageDto, TypingDto, MarkReadDto } from "./dto/index.js";
import { WsExceptionFilter } from "./ws-exception.filter.js";
import { WEBSOCKET_EVENTS } from "@fitness-app/shared";

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: "*",
    credentials: true,
  },
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Track which users are in which rooms (conversations)
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    // Apply authentication middleware
    server.use(
      createWsAuthMiddleware(this.jwtService, this.configService, this.prisma),
    );
    this.logger.log("Chat WebSocket Gateway initialized");
  }

  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.user?.id;

    if (!userId) {
      client.disconnect(true);
      return;
    }

    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

    // Track socket for this user
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Join user to their conversation rooms
    await this.joinUserRooms(client);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.user?.id;

    if (userId) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);

      // Remove socket from tracking
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  /**
   * Join user to all their conversation rooms
   */
  private async joinUserRooms(client: AuthenticatedSocket) {
    const userId = client.user.id;

    // Get all active conversations for this user
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

    // Join each conversation room
    for (const assignment of assignments) {
      if (assignment.conversation) {
        const roomId = `conversation:${assignment.conversation.id}`;
        client.join(roomId);
        this.logger.debug(`User ${userId} joined room ${roomId}`);
      }
    }
  }

  /**
   * Handle sending a message
   */
  @SubscribeMessage(WEBSOCKET_EVENTS.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.user.id;

    try {
      // Save message to database
      const message = await this.chatService.sendMessage(
        dto.conversationId,
        userId,
        dto.content,
      );

      // Broadcast to all users in the conversation room
      const roomId = `conversation:${dto.conversationId}`;
      this.server.to(roomId).emit(WEBSOCKET_EVENTS.NEW_MESSAGE, {
        message,
        conversationId: dto.conversationId,
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      };
    }
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage(WEBSOCKET_EVENTS.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ) {
    const userId = client.user.id;
    const roomId = `conversation:${dto.conversationId}`;

    // Broadcast typing indicator to others in the room (not sender)
    client.to(roomId).emit(WEBSOCKET_EVENTS.TYPING_START, {
      conversationId: dto.conversationId,
      userId,
      userName: client.user.name,
    });

    return { success: true };
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ) {
    const userId = client.user.id;
    const roomId = `conversation:${dto.conversationId}`;

    client.to(roomId).emit(WEBSOCKET_EVENTS.TYPING_STOP, {
      conversationId: dto.conversationId,
      userId,
    });

    return { success: true };
  }

  /**
   * Handle marking a message as read
   */
  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGE_READ)
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: MarkReadDto,
  ) {
    const userId = client.user.id;

    try {
      const message = await this.chatService.markMessageAsRead(
        dto.messageId,
        userId,
      );

      // Notify the sender that their message was read
      const roomId = `conversation:${message.conversationId}`;
      this.server.to(roomId).emit(WEBSOCKET_EVENTS.MESSAGE_READ, {
        messageId: message.id,
        conversationId: message.conversationId,
        readAt: message.readAt,
        readBy: userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error}`);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to mark as read",
      };
    }
  }

  /**
   * Handle joining a specific conversation room
   */
  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.user.id;

    try {
      // Verify user has access to this conversation
      await this.chatService.verifyConversationAccess(
        data.conversationId,
        userId,
      );

      const roomId = `conversation:${data.conversationId}`;
      client.join(roomId);

      this.logger.log(
        `User ${userId} joined conversation ${data.conversationId}`,
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to join conversation",
      };
    }
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  /**
   * Get all online user IDs
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
