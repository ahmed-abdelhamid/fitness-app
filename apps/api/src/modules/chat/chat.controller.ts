import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service.js";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard.js";
import { CurrentUser } from "@/common/decorators/current-user.decorator.js";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get a conversation by ID
   */
  @Get("conversations/:id")
  async getConversation(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.chatService.getConversation(id, userId);
  }

  /**
   * Get messages for a conversation
   */
  @Get("conversations/:id/messages")
  async getMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
    @Query("take") take?: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.chatService.getMessages(id, userId, {
      take: take ? parseInt(take, 10) : undefined,
      cursor,
    });
  }

  /**
   * Mark all messages in a conversation as read
   */
  @Post("conversations/:id/read")
  async markAllAsRead(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.chatService.markAllAsRead(id, userId);
  }

  /**
   * Get unread message count
   */
  @Get("unread")
  async getUnreadCount(@CurrentUser("id") userId: string) {
    return this.chatService.getUnreadCount(userId);
  }
}
