import { PrismaService } from "@/prisma/prisma.service.js";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { Role } from "@/generated/prisma/enums.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user profile with coach profile if applicable
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        coachProfile: { select: { id: true, bio: true, specialty: true } },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get user by ID (admin only)
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        coachProfile: {
          select: {
            id: true,
            bio: true,
            specialty: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  /**
   * Get all users with pagination (admin only)
   */
  async findAll(params: { skip?: number; take?: number; role?: Role }) {
    const { skip = 0, take = 20, role } = params;

    const where = role ? { role } : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, skip, take, hasMore: skip + take < total },
    };
  }

  /**
   * Get all coaches (for assignment dropdown)
   */
  async findAllCoaches() {
    return this.prisma.user.findMany({
      where: { role: Role.COACH },
      select: {
        id: true,
        email: true,
        name: true,
        coachProfile: {
          select: {
            id: true,
            bio: true,
            specialty: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get user's assigned coach
   */
  async getAssignedCoach(userId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            name: true,
            coachProfile: {
              select: {
                id: true,
                bio: true,
                specialty: true,
              },
            },
          },
        },
        conversation: { select: { id: true } },
      },
    });

    if (!assignment) {
      return null;
    }

    return {
      assignment: {
        id: assignment.id,
        status: assignment.status,
        createdAt: assignment.createdAt,
        conversationId: assignment.conversation?.id,
      },
      coach: assignment.coach,
    };
  }

  /**
   * Get coach's assigned users (clients)
   */
  async getAssignedClients(coachId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        coachId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        conversation: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments.map((a) => ({
      assignment: {
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        conversationId: a.conversation?.id,
      },
      user: a.user,
    }));
  }
}
