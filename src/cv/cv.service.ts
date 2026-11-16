import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkillEntity } from '../skill/entities/skill.entity.js';
import { UserEntity } from '../user/entities/user.entity.js';
import { UserRoleEnum } from '../user/enums/role.enum.js';
import { CreateCvDto } from './dto/create-cv.dto.js';
import { UpdateCvDto } from './dto/update-cv.dto.js';
import { CvEntity } from './entities/cv.entity.js';

// Seules les infos nécessaires aux décisions d'accès : l'utilisateur connecté.
type CurrentUser = Pick<UserEntity, 'id' | 'role'>;

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(CvEntity) private readonly cvRepository: Repository<CvEntity>,
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

  private isAdmin(user: CurrentUser): boolean {
    return user.role === UserRoleEnum.ADMIN;
  }

  private async findById(id: number): Promise<CvEntity> {
    const cv = await this.cvRepository.findOne({
      where: { id },
      relations: { user: true, skills: true },
    });
    if (!cv) throw new NotFoundException(`CV ${id} introuvable`);
    return cv;
  }

  private assertOwner(cv: CvEntity, user: CurrentUser): void {
    if (cv.userId !== user.id) {
      throw new ForbiddenException("Ce CV ne vous appartient pas");
    }
  }

  // Ex. 12 : le propriétaire est le user connecté, jamais une valeur du body.
  async create(dto: CreateCvDto, user: CurrentUser): Promise<CvEntity> {
    const { skillIds, ...properties } = dto;
    const cv = this.cvRepository.create({
      ...properties,
      userId: user.id,
      skills: await this.getSkills(skillIds),
    });
    return this.cvRepository.save(cv);
  }

  // Ex. 14 : admin -> tous les CV ; user -> uniquement les siens.
  findAll(user: CurrentUser): Promise<CvEntity[]> {
    return this.cvRepository.find({
      where: this.isAdmin(user) ? {} : { userId: user.id },
      relations: { user: true, skills: true },
    });
  }

  // Lecture : propriétaire ou admin.
  async findOne(id: number, user: CurrentUser): Promise<CvEntity> {
    const cv = await this.findById(id);
    if (!this.isAdmin(user)) this.assertOwner(cv, user);
    return cv;
  }

  // Ex. 12 : modification et suppression réservées au propriétaire.
  async update(id: number, dto: UpdateCvDto, user: CurrentUser): Promise<CvEntity> {
    const cv = await this.findById(id);
    this.assertOwner(cv, user);
    const { skillIds, ...properties } = dto;
    Object.assign(cv, properties);
    if (skillIds !== undefined) cv.skills = await this.getSkills(skillIds);
    return this.cvRepository.save(cv);
  }

  async remove(id: number, user: CurrentUser): Promise<void> {
    const cv = await this.findById(id);
    this.assertOwner(cv, user);
    await this.cvRepository.remove(cv);
  }
}
