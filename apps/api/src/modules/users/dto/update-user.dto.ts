import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @IsOptional()
  name?: string;
}
