import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Center } from '../centers/center.entity';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Specialist } from '../specialists/specialist.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startDateTime: Date;

  @Column()
  duration: number;

  @Column({ default: false })
  outsideAvailability: boolean;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @ManyToOne(() => Client, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  client: Client;

  @ManyToOne(() => ServiceEntity, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  service: ServiceEntity;

  @ManyToOne(() => Center, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  center: Center;

  @ManyToOne(() => Specialist, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  specialist: Specialist;
}
