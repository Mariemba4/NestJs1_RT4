import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { StatusEnum } from '../enums/status.enum.js';

@Entity()
export class TodoEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        name: string;

    @Column()
        description: string;

    @CreateDateColumn()
        createdAt: Date;

    @Column({
        type: 'enum',
        enum: StatusEnum,
        default: StatusEnum.TODO,
    })
    status: StatusEnum;
}