import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Center } from '../centers/center.entity';

export enum AvailabilityExceptionType {
  BLOCKED = 'BLOCKED',
  EXTRA_AVAILABLE = 'EXTRA_AVAILABLE',
}

@Entity()
export class AvailabilityException {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({
    type: 'enum',
    enum: AvailabilityExceptionType,
  })
  type: AvailabilityExceptionType;

  @Column({ nullable: true })
  label?: string;

  @ManyToOne(() => Center, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  center: Center;
}
