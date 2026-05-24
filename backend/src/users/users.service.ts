import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Obtiene todos los usuarios registrados
  findAll() {
    return this.usersRepository.find();
  }

  // Busca un usuario por su email
  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // Crea un nuevo usuario
  async create(userData: CreateUserDto) {
    if (!userData.password)
      throw new BadRequestException('Contraseña requerida');
    
    // Verifica que no exista otro usuario con el mismo email
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser)
      throw new BadRequestException('Ya existe un usuario con ese email');

    // Hash del password antes de guardarla en la BBDD
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Crea la entidad User a partir del DTO y el password hasheado
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  // Actualiza un usuario existente por su ID
  async update(id: number, userData: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException('No se ha encontrado el usuario');

    if (userData.password)
      userData.password = await bcrypt.hash(userData.password, 10);

    // Evita que un administrador sea degradado a otro rol
    if (
      user.role === UserRole.ADMIN &&
      userData.role &&
      userData.role !== UserRole.ADMIN
    )
      throw new BadRequestException('No se puede degradar un administrador');

    // Verifica que el nuevo email no esté ya registrado por otro usuario
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: {
          email: userData.email,
        },
      });

      if (existingUser)
        throw new BadRequestException('Ya existe un usuario con ese email');
    }

    Object.assign(user, userData);

    return this.usersRepository.save(user);
  }
}
