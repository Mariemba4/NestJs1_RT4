import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillEntity } from './entities/skill.entity.js';

@Injectable()
export class SkillService {
  constructor(@InjectRepository(SkillEntity) private readonly skillRepository: Repository<SkillEntity>) {}

  create(dto: CreateSkillDto): Promise<SkillEntity> {
    return this.skillRepository.save(this.skillRepository.create(dto));
  }

  findAll(): Promise<SkillEntity[]> { return this.skillRepository.find(); }

  async findOne(id: number): Promise<SkillEntity> {
    const skill = await this.skillRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException(`Compétence ${id} introuvable`);
    return skill;
  }

  async update(id: number, dto: UpdateSkillDto): Promise<SkillEntity> {
    const skill = await this.skillRepository.preload({ id, ...dto });
    if (!skill) throw new NotFoundException(`Compétence ${id} introuvable`);
    return this.skillRepository.save(skill);
  }

  async remove(id: number): Promise<void> {
    await this.skillRepository.remove(await this.findOne(id));
  }
}
