import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Center } from '../centers/center.entity';
import { User } from '../users/user.entity';

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email?: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: 0 })
  priority: number;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user?: User;

  @ManyToOne(() => Center, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  center?: Center | null;
}
