import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Invalid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
