import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/timestamped.entity.js';
import { CvEntity } from '../../cv/entities/cv.entity.js';

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

  @OneToMany(() => CvEntity, (cv) => cv.user)
  cvs: CvEntity[];
}
