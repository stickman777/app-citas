import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentRequestsModule } from '../appointment-requests/appointment-requests.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientsModule } from '../clients/clients.module';
import { ServiceEntity } from '../services/service.entity';
import { Specialist } from '../specialists/specialist.entity';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';

@Module({
  imports: [
    ClientsModule,
    AppointmentsModule,
    AppointmentRequestsModule,
    TypeOrmModule.forFeature([ServiceEntity, Specialist]),
  ],
  controllers: [ClientPortalController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
