import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { CentersModule } from '../centers/centers.module';
import { Center } from '../centers/center.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Center]), CentersModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
