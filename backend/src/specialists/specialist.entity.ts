import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Center } from '../centers/center.entity';

export enum SpecialistStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  VACATION = 'VACATION',
}

@Entity()
export class Specialist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  specialty?: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: SpecialistStatus,
    default: SpecialistStatus.ACTIVE,
  })
  status: SpecialistStatus;

  @ManyToOne(() => Center, (center) => center.specialists, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  center: Center;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
