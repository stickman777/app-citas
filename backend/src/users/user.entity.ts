import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Center } from '../centers/center.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
  CLIENT = 'CLIENT',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: '' })
  name: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @ManyToMany(() => Center)
  @JoinTable()
  centers?: Center[];

  @ManyToOne(() => Center, { nullable: true })
  activeCenter?: Center | null;
}
