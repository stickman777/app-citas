import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CentersModule } from '../centers/centers.module';
import { AppointmentRequest } from './appointment-request.entity';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { AppointmentRequestsService } from './appointment-requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentRequest]),
    AppointmentsModule,
    CentersModule,
  ],
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService],
  exports: [AppointmentRequestsService],
})
export class AppointmentRequestsModule {}
