import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Specialist } from './specialist.entity';

// Ausencia temporal de un especialista (vacaciones, días fuera). Durante el
// rango de fechas [startDate, endDate] no se le pueden agendar citas.
@Entity()
export class SpecialistAbsence {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Specialist, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  specialist: Specialist;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', nullable: true })
  reason?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
