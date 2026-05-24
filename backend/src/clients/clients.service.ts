import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  findAll() {
    return this.clientsRepository.find();
  }

  create(clientData: CreateClientDto) {
    const client = this.clientsRepository.create(clientData);
    return this.clientsRepository.save(client);
  }
}
