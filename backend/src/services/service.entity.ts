import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Center } from '../centers/center.entity';
import { Specialist } from '../specialists/specialist.entity';

@Entity()
export class ServiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'duration' })
  durationMinutes: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price?: number | null;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Center, (center) => center.services, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  center?: Center | null;

  @ManyToOne(() => Specialist, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  specialist?: Specialist | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
