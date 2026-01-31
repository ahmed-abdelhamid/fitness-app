import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsUUID("4", { message: "Invalid conversation ID" })
  @IsNotEmpty({ message: "Conversation ID is required" })
  conversationId: string;

  @IsString()
  @IsNotEmpty({ message: "Message content is required" })
  @MaxLength(5000, { message: "Message is too long" })
  content: string;
}
