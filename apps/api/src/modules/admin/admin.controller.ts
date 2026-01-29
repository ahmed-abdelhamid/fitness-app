import { Roles } from "@/common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard.js";
import { RolesGuard } from "@/common/guards/roles.guard.js";
import { AssignmentStatus, Role } from "@/generated/prisma/enums.js";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service.js";
import { CreateAssignmentDto } from "./dto/create-assignment.dto.js";
import { CurrentUser } from "@/common/decorators/current-user.decorator.js";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Create a new assignment (assign coach to user)
   */
  @Post("assignments")
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminService.createAssignment(dto, adminId);
  }

  /**
   * Get all assignments
   */
  @Get("assignments")
  async getAllAssignments(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("status") status?: AssignmentStatus,
  ) {
    return this.adminService.getAllAssignments({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status,
    });
  }

  /**
   * End an assignment
   */
  @Patch("assignments/:id/end")
  async endAssignment(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.endAssignment(id);
  }
}
