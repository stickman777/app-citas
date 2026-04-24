import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // Endpoint to get all users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  // Endpoint to create a new user
  @Post()
  create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }
}
