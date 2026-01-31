import { IsBoolean, IsNotEmpty, IsUUID } from "class-validator";

export class TypingDto {
  @IsUUID("4", { message: "Invalid conversation ID" })
  @IsNotEmpty({ message: "Conversation ID is required" })
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}
