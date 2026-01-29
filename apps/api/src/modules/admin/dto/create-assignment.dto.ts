import { IsUUID } from "class-validator";

export class CreateAssignmentDto {
  @IsUUID("4", { message: "Invalid user ID" })
  userId: string;

  @IsUUID("4", { message: "Invalid coach ID" })
  coachId: string;
}
