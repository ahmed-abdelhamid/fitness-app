import { z } from "zod";
import { Role } from "../types";

// Auth schemas
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(Role).optional().default(Role.USER),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Message schemas
export const sendMessageSchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
});

// Assignment schemas
export const createAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  coachId: z.string().uuid("Invalid coach ID"),
});

// Type exports from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
