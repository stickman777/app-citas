import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startDateTime: Date;

  @Column()
  duration: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  // Me traigo la relación con cliente y servicio
  @ManyToOne(() => Client, { eager: true })
  client: Client;

  @ManyToOne(() => ServiceEntity, { eager: true })
  service: ServiceEntity;
}
