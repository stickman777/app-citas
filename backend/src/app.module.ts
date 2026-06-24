import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { CentersModule } from './centers/centers.module';
import { SpecialistsModule } from './specialists/specialists.module';
import { DemoSeedService } from './demo-seed.service';
import { ClientPortalModule } from './client-portal/client-portal.module';
import { AppointmentRequestsModule } from './appointment-requests/appointment-requests.module';
import {
  getDatabasePort,
  getEnvFlag,
  getRequiredEnv,
  isProduction,
  validateEnvironment,
} from './config/environment';

validateEnvironment();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: getRequiredEnv('DB_HOST'),
      port: getDatabasePort(),
      username: getRequiredEnv('DB_USERNAME'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_DATABASE'),
      autoLoadEntities: true,
      synchronize:
        !isProduction && getEnvFlag('TYPEORM_SYNCHRONIZE'),
    }),
    UsersModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
    AppointmentsModule,
    AvailabilityModule,
    CentersModule,
    SpecialistsModule,
    ClientPortalModule,
    AppointmentRequestsModule,
  ],
  providers: [DemoSeedService],
})
export class AppModule {}
