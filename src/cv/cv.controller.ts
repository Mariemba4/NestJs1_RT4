import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateCvDto } from './dto/create-cv.dto.js';
import { UpdateCvDto } from './dto/update-cv.dto.js';
import { CvService } from './cv.service.js';

@Controller('cvs')
export class CvController {
  constructor(private readonly cvService: CvService) {}
  @Post() create(@Body() dto: CreateCvDto) { return this.cvService.create(dto); }
  @Get() findAll() { return this.cvService.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.cvService.findOne(id); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCvDto) { return this.cvService.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.cvService.remove(id); }
}
