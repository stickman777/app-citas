import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentersModule } from '../centers/centers.module';
import { Specialist } from './specialist.entity';
import { SpecialistsController } from './specialists.controller';
import { SpecialistsService } from './specialists.service';

@Module({
  imports: [TypeOrmModule.forFeature([Specialist]), CentersModule],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
