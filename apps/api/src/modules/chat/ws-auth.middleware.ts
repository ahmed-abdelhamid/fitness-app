import { Role } from "@/generated/prisma/enums.js";
import { PrismaService } from "@/prisma/prisma.service.js";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { JwtPayload } from "../auth/types/auth.types.js";

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export type SocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export const createWsAuthMiddleware = (
  jwtService: JwtService,
  configService: ConfigService,
  prisma: PrismaService,
): SocketMiddleware => {
  return async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      // Verify token
      const payload = await jwtService.verifyAsync<JwtPayload>(token, {
        secret: configService.get<string>("JWT_SECRET"),
      });

      if (!payload || !payload.sub) {
        return next(new Error("Invalid token"));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      (socket as AuthenticatedSocket).user = user;

      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  };
};
