import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkillEntity } from '../skill/entities/skill.entity.js';
import { UserEntity } from '../user/entities/user.entity.js';
import { CreateCvDto } from './dto/create-cv.dto.js';
import { UpdateCvDto } from './dto/update-cv.dto.js';
import { CvEntity } from './entities/cv.entity.js';

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(CvEntity) private readonly cvRepository: Repository<CvEntity>,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SkillEntity) private readonly skillRepository: Repository<SkillEntity>,
  ) {}

  private async getSkills(skillIds: number[] = []): Promise<SkillEntity[]> {
    if (skillIds.length === 0) return [];
    const skills = await this.skillRepository.findBy({ id: In(skillIds) });
    if (skills.length !== skillIds.length) {
      throw new NotFoundException('Une ou plusieurs compétences sont introuvables');
    }
    return skills;
  }

  async create(dto: CreateCvDto): Promise<CvEntity> {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException(`Utilisateur ${dto.userId} introuvable`);

    const cv = this.cvRepository.create({
      name: dto.name,
      firstname: dto.firstname,
      age: dto.age,
      cin: dto.cin,
      job: dto.job,
      path: dto.path,
      userId: user.id,
      skills: await this.getSkills(dto.skillIds),
    });
    return this.cvRepository.save(cv);
  }

  findAll(): Promise<CvEntity[]> {
    return this.cvRepository.find({ relations: { user: true, skills: true } });
  }

  async findOne(id: number): Promise<CvEntity> {
    const cv = await this.cvRepository.findOne({
      where: { id },
      relations: { user: true, skills: true },
    });
    if (!cv) throw new NotFoundException(`CV ${id} introuvable`);
    return cv;
  }

  async update(id: number, dto: UpdateCvDto): Promise<CvEntity> {
    const cv = await this.findOne(id);
    const { skillIds, ...properties } = dto;
    Object.assign(cv, properties);
    if (skillIds !== undefined) cv.skills = await this.getSkills(skillIds);
    return this.cvRepository.save(cv);
  }

  async remove(id: number): Promise<void> {
    await this.cvRepository.remove(await this.findOne(id));
  }
}
