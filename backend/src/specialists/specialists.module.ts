import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentersModule } from '../centers/centers.module';
import { SpecialistAbsence } from './specialist-absence.entity';
import { Specialist } from './specialist.entity';
import { SpecialistsController } from './specialists.controller';
import { SpecialistsService } from './specialists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Specialist, SpecialistAbsence]),
    CentersModule,
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
