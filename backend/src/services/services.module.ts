import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServiceEntity } from './service.entity';
import { CentersModule } from '../centers/centers.module';
import { Specialist } from '../specialists/specialist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceEntity, Specialist]),
    CentersModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
