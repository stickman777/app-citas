import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';

@Module({
  imports: [
    // Entidades necesarias para el módulo de citas
    TypeOrmModule.forFeature([
      Appointment,
      Client,
      ServiceEntity
    ])
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
