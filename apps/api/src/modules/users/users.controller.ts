import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard.js";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { CurrentUser, Roles } from "@/common/decorators/index.js";
import { UpdateUserDto } from "./dto/index.js";
import { RolesGuard } from "@/common/guards/index.js";
import { Role } from "@/generated/prisma/enums.js";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user's profile
   */
  @Get("me")
  async getProfile(@CurrentUser("id") userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * Update current user's profile
   */
  @Patch("me")
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  /**
   * Get current user's assigned coach (for USER role)
   */
  @Get("me/coach")
  async getMyCoach(@CurrentUser("id") userId: string) {
    return this.usersService.getAssignedCoach(userId);
  }

  /**
   * Get current coach's assigned clients (for COACH role)
   */
  @Get("me/clients")
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  async getMyClients(@CurrentUser("id") coachId: string) {
    return this.usersService.getAssignedClients(coachId);
  }

  /**
   * Get all users (admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("role") role?: Role,
  ) {
    return this.usersService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      role,
    });
  }

  /**
   * Get all coaches (admin only, for assignment dropdown)
   */
  @Get("coaches")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAllCoaches() {
    return this.usersService.findAllCoaches();
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
