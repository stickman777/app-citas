import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
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
  email?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: 0 })
  priority: number;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user?: User;
}
