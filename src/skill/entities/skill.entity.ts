import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TimestampedEntity } from '../../common/entities/timestamped.entity.js';
import { CvEntity } from '../../cv/entities/cv.entity.js';

@Entity('skills')
export class SkillEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  designation: string;

  @ManyToMany(() => CvEntity, (cv) => cv.skills)
  cvs: CvEntity[];
}
