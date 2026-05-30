import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceEntity } from '../services/service.entity';
import { Specialist } from '../specialists/specialist.entity';

@Entity()
export class Center {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ServiceEntity, (service) => service.center)
  services?: ServiceEntity[];

  @OneToMany(() => Specialist, (specialist) => specialist.center)
  specialists?: Specialist[];
}
