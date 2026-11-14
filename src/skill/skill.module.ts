import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillController } from './skill.controller.js';
import { SkillEntity } from './entities/skill.entity.js';
import { SkillService } from './skill.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity])],
  controllers: [SkillController],
  providers: [SkillService],
  exports: [TypeOrmModule],
})
export class SkillModule {}
