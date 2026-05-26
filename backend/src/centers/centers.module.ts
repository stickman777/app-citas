import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Center } from './center.entity';
import { CentersController } from './centers.controller';
import { CentersService } from './centers.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Center, User])],
  controllers: [CentersController],
  providers: [CentersService],
  exports: [CentersService, TypeOrmModule],
})
export class CentersModule {}
