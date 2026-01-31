import { IsNotEmpty, IsUUID } from "class-validator";

export class MarkReadDto {
  @IsUUID("4", { message: "Invalid message ID" })
  @IsNotEmpty({ message: "Message ID is required" })
  messageId: string;
}
