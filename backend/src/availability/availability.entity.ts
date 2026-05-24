import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
