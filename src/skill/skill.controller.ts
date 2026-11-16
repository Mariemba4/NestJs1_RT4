import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRoleEnum } from '../user/enums/role.enum.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillService } from './skill.service.js';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get() findAll() { return this.skillService.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.skillService.findOne(id); }

  // Les compétences sont partagées par tous les CV : seuls les admins les modifient.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @Post() create(@Body() dto: CreateSkillDto) { return this.skillService.create(dto); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSkillDto) { return this.skillService.update(id, dto); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.skillService.remove(id); }
}
