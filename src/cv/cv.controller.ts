import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { UserEntity } from '../user/entities/user.entity.js';
import { CreateCvDto } from './dto/create-cv.dto.js';
import { UpdateCvDto } from './dto/update-cv.dto.js';
import { CvService } from './cv.service.js';

// Toutes les routes exigent un utilisateur connecté (JWT) ; @CurrentUser() le fournit.
@UseGuards(JwtAuthGuard)
@Controller('cvs')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  create(@Body() dto: CreateCvDto, @CurrentUser() user: UserEntity) {
    return this.cvService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.cvService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.cvService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCvDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.cvService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.cvService.remove(id, user);
  }
}
