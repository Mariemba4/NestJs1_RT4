import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/timestamped.entity.js';
import { CvEntity } from '../../cv/entities/cv.entity.js';
import { UserRoleEnum } from '../enums/role.enum.js';

@Entity('users')
export class UserEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.USER })
  role: UserRoleEnum;


  @OneToMany(() => CvEntity, (cv) => cv.user)
  cvs: Relation<CvEntity[]>;
}
