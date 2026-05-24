import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    // Load environment variables from .env file and make them available globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configure TypeORM to connect to the PostgreSQL database using environment variables
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      // Automatically synchronize the database schema with the entities (DON'T USE in PRODUCTION)
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
    AppointmentsModule,
    AvailabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
