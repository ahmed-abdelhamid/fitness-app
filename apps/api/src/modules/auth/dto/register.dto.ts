import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Role } from "../../../generated/prisma/enums.js";

export class RegisterDto {
  @IsEmail({}, { message: "Invalid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be al least 8 characters" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @IsNotEmpty({ message: "Name is required" })
  name: string;

  @IsEnum(Role, { message: "Role must be USER, COACH, or ADMIN" })
  @IsOptional()
  role?: Role = Role.USER;
}
