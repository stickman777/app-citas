import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize:
        !isProduction && process.env.TYPEORM_SYNCHRONIZE !== 'false',
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
