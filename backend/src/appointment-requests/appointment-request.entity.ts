import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Center } from '../centers/center.entity';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Specialist } from '../specialists/specialist.entity';

export enum AppointmentRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Solicitud de cita creada por un cliente cuando el horario deseado no es
// auto-reservable (fuera del horario del centro o con el hueco ocupado). El
// gestor la revisa y decide; es una entidad aparte de Appointment para no
// contaminar las citas confirmadas ni la restricción de exclusión de solapes.
@Entity()
export class AppointmentRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  client: Client;

  @ManyToOne(() => ServiceEntity, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  service: ServiceEntity;

  @ManyToOne(() => Specialist, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  specialist: Specialist;

  @ManyToOne(() => Center, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  center: Center;

  @Column()
  requestedStartDateTime: Date;

  // True si la cita deseada cae fuera del horario del centro. Si es false pero
  // la solicitud existe, es porque el hueco estaba ocupado.
  @Column({ default: false })
  outsideAvailability: boolean;

  @Column({ type: 'varchar', nullable: true })
  notes?: string | null;

  @Column({
    type: 'enum',
    enum: AppointmentRequestStatus,
    default: AppointmentRequestStatus.PENDING,
  })
  status: AppointmentRequestStatus;

  @Column({ type: 'varchar', nullable: true })
  resolutionNote?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date | null;

  // Cita creada al aprobar la solicitud (trazabilidad).
  @ManyToOne(() => Appointment, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  appointment?: Appointment | null;

  @CreateDateColumn()
  createdAt: Date;
}
