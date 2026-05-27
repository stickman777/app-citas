import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './availability.entity';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { CentersModule } from '../centers/centers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Availability]), CentersModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
