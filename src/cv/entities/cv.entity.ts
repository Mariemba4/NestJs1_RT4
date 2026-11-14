import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TimestampedEntity } from '../../common/entities/timestamped.entity.js';
import { SkillEntity } from '../../skill/entities/skill.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';

@Entity('cvs')
export class CvEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  firstname: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ unique: true })
  cin: string;

  @Column()
  job: string;

  @Column()
  path: string;

  @ManyToOne(() => UserEntity, (user) => user.cvs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: number;

  @ManyToMany(() => SkillEntity, (skill) => skill.cvs)
  @JoinTable({ name: 'cv_skills' })
  skills: SkillEntity[];
}
