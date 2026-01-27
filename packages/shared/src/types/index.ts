export enum Role {
  USER = "USER",
  COACH = "COACH",
  ADMIN = "ADMIN",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coach {
  id: string;
  userId: string;
  bio?: string;
  specialty?: string;
  user?: User;
}

export interface Assignment {
  id: string;
  userId: string;
  coachId: string;
  assignedBy?: string;
  status: AssignmentStatus;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  assignmentId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: Date;
  readAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
