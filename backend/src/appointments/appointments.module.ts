import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Client } from '../clients/client.entity';
import { ServiceEntity } from '../services/service.entity';
import { Availability } from '../availability/availability.entity';
import { AvailabilityException } from '../availability/availability-exception.entity';
import { CentersModule } from '../centers/centers.module';
import { Specialist } from '../specialists/specialist.entity';

@Module({
  imports: [
    // Entidades necesarias para el módulo de citas
    TypeOrmModule.forFeature([
      Appointment,
      Client,
      ServiceEntity,
      Specialist,
      Availability,
      AvailabilityException,
    ]),
    CentersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
