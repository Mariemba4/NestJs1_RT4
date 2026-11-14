import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from '../skill/entities/skill.entity.js';
import { UserEntity } from '../user/entities/user.entity.js';
import { CvController } from './cv.controller.js';
import { CvEntity } from './entities/cv.entity.js';
import { CvService } from './cv.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CvEntity, UserEntity, SkillEntity])],
  controllers: [CvController],
  providers: [CvService],
})
export class CvModule {}
