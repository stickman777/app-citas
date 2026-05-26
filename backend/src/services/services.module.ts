import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServiceEntity } from './service.entity';
import { Center } from '../centers/center.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity, Center])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
