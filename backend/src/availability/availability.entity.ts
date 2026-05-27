import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Center } from '../centers/center.entity';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dayOfWeek: number; // 0 domingo, 1 lunes...

  @Column()
  startTime: string; // "09:00"

  @Column()
  endTime: string; // "14:00"

  @ManyToOne(() => Center, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  center?: Center | null;
}
