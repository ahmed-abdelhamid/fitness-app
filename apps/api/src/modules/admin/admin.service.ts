import { PrismaService } from "@/prisma/prisma.service.js";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateAssignmentDto } from "./dto/create-assignment.dto.js";
import { AssignmentStatus, Role } from "@/generated/prisma/enums.js";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign a coach to a user
   * Also creates a conversation for them
   */
  async createAssignment(dto: CreateAssignmentDto, adminId: string) {
    // Verify user exists and is a USER
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.USER) {
      throw new BadRequestException(
        "Can only assign coaches to users with USER role",
      );
    }

    // Verify coach exists and is a COACH
    const coach = await this.prisma.user.findUnique({
      where: { id: dto.coachId },
    });

    if (!coach) {
      throw new NotFoundException("Coach not found");
    }

    if (coach.role !== Role.COACH) {
      throw new BadRequestException("Selected user is not a coach");
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.assignment.findFirst({
      where: {
        userId: dto.userId,
        coachId: dto.coachId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        "This user is already assigned to this coach",
      );
    }

    // Create assignment and conversation in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // End any existing active assignments for this user
      await tx.assignment.updateMany({
        where: { userId: dto.userId, status: AssignmentStatus.ACTIVE },
        data: { status: AssignmentStatus.ENDED },
      });

      // Create new assignment
      const assignment = await tx.assignment.create({
        data: {
          userId: dto.userId,
          coachId: dto.coachId,
          assignedBy: adminId,
          status: AssignmentStatus.ACTIVE,
        },
      });

      // Create conversation for the assignment
      const conversation = await tx.conversation.create({
        data: { assignmentId: assignment.id },
      });

      return { assignment, conversation };
    });

    // Return with user and coach details
    return this.prisma.assignment.findUnique({
      where: { id: result.assignment.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        coach: {
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
    });
  }

  /**
   * Get all assignments with pagination
   */
  async getAllAssignments(params: {
    skip?: number;
    take?: number;
    status?: AssignmentStatus;
  }) {
    const { skip = 0, take = 20, status } = params;

    const where = status ? { status } : {};

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          coach: {
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
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  /**
   * End an assignment
   */
  async endAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException("Assignment is not active");
    }

    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.ENDED },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
