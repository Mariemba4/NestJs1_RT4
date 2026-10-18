import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { StatusEnum } from '../enums/status.enum.js';
import { TimestampedEntity } from '../../common/entities/timestamped.entity.js';

@Entity()
export class TodoEntity extends TimestampedEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        name: string;

    @Column()
        description: string;

    @Column({
        type: 'enum',
        enum: StatusEnum,
        default: StatusEnum.TODO,
    })
    status: StatusEnum;
}
