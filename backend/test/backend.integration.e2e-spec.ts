import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppointmentRequest } from '../src/appointment-requests/appointment-request.entity';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { AvailabilityException } from '../src/availability/availability-exception.entity';
import { Availability } from '../src/availability/availability.entity';
import { Center } from '../src/centers/center.entity';
import { Client } from '../src/clients/client.entity';
import { ServiceEntity } from '../src/services/service.entity';
import { SpecialistAbsence } from '../src/specialists/specialist-absence.entity';
import {
  Specialist,
  SpecialistStatus,
} from '../src/specialists/specialist.entity';
import { User, UserRole } from '../src/users/user.entity';

jest.setTimeout(60000);

process.env.NODE_ENV = 'test';
process.env.TYPEORM_SYNCHRONIZE = 'true';
process.env.SEED_DEMO_DATA = 'false';
process.env.SEED_RESET_DATA = 'false';
process.env.JWT_SECRET ??= 'integration_test_secret';
process.env.ADMIN_EMAIL = 'admin.integration@app-citas.test';
process.env.ADMIN_PASSWORD = 'admin1234';
process.env.ADMIN_ALIAS = 'admin-integration';
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_USERNAME ??= 'postgres';
process.env.DB_PASSWORD ??= 'postgres';
process.env.DB_DATABASE =
  process.env.TEST_DB_DATABASE ?? process.env.DB_DATABASE ?? 'app_citas_test';

type SeedData = {
  centerA: Center;
  centerB: Center;
  serviceA: ServiceEntity;
  serviceB: ServiceEntity;
  specialistA: Specialist;
  specialistB: Specialist;
  clientA: Client;
  clientB: Client;
};

describe('Integracion HTTP backend - HU-01..HU-08 RNF-01 RNF-02', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let httpServer: App;
  let seed: SeedData;
  let adminToken: string;
  let managerToken: string;
  let clientToken: string;

  const futureDate = '2030-06-17';

  beforeAll(async () => {
    await ensureTestDatabaseExists();
    await recreateTestSchema();

    const { AppModule } = require('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    httpServer = app.getHttpServer();
    seed = await seedDatabase(dataSource);
    adminToken = await login(
      process.env.ADMIN_EMAIL!,
      process.env.ADMIN_PASSWORD!,
    );
    managerToken = await login('gestor.a@app-citas.test', 'gestor1234');
    clientToken = await login('cliente.a@app-citas.test', 'cliente1234');
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('HU-07 RNF-02 arranque de base de datos', () => {
    it('crea la extension btree_gist y las restricciones de exclusion de solape', async () => {
      const extensions = await dataSource.query(
        "SELECT extname FROM pg_extension WHERE extname = 'btree_gist'",
      );
      const constraints = await dataSource.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conname IN (
          'appointment_no_overlap_specialist',
          'appointment_no_overlap_client'
        )
      `);

      expect(extensions).toHaveLength(1);
      expect(constraints.map((row: { conname: string }) => row.conname).sort())
        .toEqual([
          'appointment_no_overlap_client',
          'appointment_no_overlap_specialist',
        ]);
    });
  });

  describe('HU-01 RNF-01 autenticacion y autorizacion', () => {
    it('devuelve token 201 con credenciales validas', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        })
        .expect(201);

      expect(response.body.access_token).toEqual(expect.any(String));
    });

    it('devuelve 401 con credenciales invalidas', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({
          email: process.env.ADMIN_EMAIL,
          password: 'password-incorrecto',
        })
        .expect(401);
    });

    it('devuelve 401 al acceder a una ruta privada sin token', async () => {
      await request(httpServer).get('/auth/me').expect(401);
    });

    it('devuelve 403 cuando el rol no esta autorizado para la ruta', async () => {
      await request(httpServer)
        .get('/users')
        .set('Authorization', bearer(clientToken))
        .expect(403);
    });
  });

  describe('HU-02 RNF-01 gestion de usuarios por administrador', () => {
    it('persiste alta, edicion y baja validas de un usuario gestionado por admin', async () => {
      const createdResponse = await request(httpServer)
        .post('/users')
        .set('Authorization', bearer(adminToken))
        .send({
          email: 'gestor.crud@app-citas.test',
          name: 'Gestor CRUD',
          password: 'gestor1234',
          role: UserRole.GESTOR,
          centerIds: [seed.centerA.id],
        })
        .expect(201);

      const userId = createdResponse.body.id;
      expect(createdResponse.body.password).toBeUndefined();
      await expectUser(userId, {
        email: 'gestor.crud@app-citas.test',
        name: 'Gestor CRUD',
        role: UserRole.GESTOR,
      });

      await request(httpServer)
        .patch(`/users/${userId}`)
        .set('Authorization', bearer(adminToken))
        .send({
          name: 'Gestor CRUD Editado',
          centerIds: [seed.centerA.id, seed.centerB.id],
        })
        .expect(200);

      await expectUser(userId, {
        name: 'Gestor CRUD Editado',
        centerIds: [seed.centerA.id, seed.centerB.id],
      });

      await request(httpServer)
        .delete(`/users/${userId}`)
        .set('Authorization', bearer(adminToken))
        .expect(200);

      await expect(
        dataSource.getRepository(User).findOne({ where: { id: userId } }),
      ).resolves.toBeNull();
    });

    it('devuelve 400 cuando los datos de usuario quedan fuera del contrato', async () => {
      await request(httpServer)
        .post('/users')
        .set('Authorization', bearer(adminToken))
        .send({
          email: 'no-es-email',
          name: '',
          password: 'short',
          role: 'SUPERADMIN',
          centerIds: [seed.centerA.id],
        })
        .expect(400);
    });

    it('devuelve 403 cuando un rol no admin intenta asignar ADMIN', async () => {
      await request(httpServer)
        .post('/users')
        .set('Authorization', bearer(managerToken))
        .send({
          email: 'admin.no@app-citas.test',
          name: 'Admin no permitido',
          password: 'admin1234',
          role: UserRole.ADMIN,
          centerIds: [],
        })
        .expect(403);
    });
  });

  describe('HU-07 ciclo de vida de citas', () => {
    it('permite al gestor consultar huecos, crear, reprogramar, cancelar y completar citas por HTTP', async () => {
      const slotsResponse = await request(httpServer)
        .get('/appointments/available-slots')
        .set('Authorization', bearer(managerToken))
        .query({
          date: futureDate,
          serviceId: seed.serviceA.id,
          specialistId: seed.specialistA.id,
        })
        .expect(200);

      expect(slotsResponse.body).toContain('09:00');

      const createdResponse = await request(httpServer)
        .post('/appointments')
        .set('Authorization', bearer(managerToken))
        .send({
          startDateTime: `${futureDate}T09:00:00`,
          clientId: seed.clientA.id,
          serviceId: seed.serviceA.id,
          specialistId: seed.specialistA.id,
        })
        .expect(201);

      const appointmentId = createdResponse.body.id;
      expect(createdResponse.body.status).toBe(AppointmentStatus.SCHEDULED);

      const rescheduledResponse = await request(httpServer)
        .patch(`/appointments/${appointmentId}/reschedule`)
        .set('Authorization', bearer(managerToken))
        .send({
          startDateTime: `${futureDate}T09:30:00`,
        })
        .expect(200);

      expect(rescheduledResponse.body.startDateTime).toBe(
        new Date(`${futureDate}T09:30:00`).toISOString(),
      );

      await request(httpServer)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', bearer(managerToken))
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(AppointmentStatus.CANCELLED);
        });

      const pastAppointment = await dataSource.getRepository(Appointment).save({
        startDateTime: new Date('2020-01-06T10:00:00'),
        duration: seed.serviceA.durationMinutes,
        status: AppointmentStatus.SCHEDULED,
        outsideAvailability: false,
        center: seed.centerA,
        client: seed.clientA,
        service: seed.serviceA,
        specialist: seed.specialistA,
      });

      await request(httpServer)
        .patch(`/appointments/${pastAppointment.id}/complete`)
        .set('Authorization', bearer(managerToken))
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(AppointmentStatus.COMPLETED);
        });
    });

    it('HU-07 RNF-02 devuelve 409 cuando PostgreSQL rechaza la segunda cita solapada concurrente', async () => {
      const payload = {
        startDateTime: `${futureDate}T10:30:00`,
        clientId: seed.clientA.id,
        serviceId: seed.serviceA.id,
        specialistId: seed.specialistA.id,
      };
      const appointmentsService = app.get(AppointmentsService) as any;
      const specialistOverlapSpy = jest
        .spyOn(appointmentsService, 'hasOverlappingAppointment')
        .mockResolvedValue(false);
      const clientOverlapSpy = jest
        .spyOn(appointmentsService, 'hasOverlappingClientAppointment')
        .mockResolvedValue(false);

      try {
        const responses = await Promise.all([
          request(httpServer)
            .post('/appointments')
            .set('Authorization', bearer(managerToken))
            .send(payload),
          request(httpServer)
            .post('/appointments')
            .set('Authorization', bearer(managerToken))
            .send(payload),
        ]);

        expect(responses.map((response) => response.status).sort()).toEqual([
          201,
          409,
        ]);
      } finally {
        specialistOverlapSpy.mockRestore();
        clientOverlapSpy.mockRestore();
      }
    });

    it('RNF-02 devuelve 400 cuando la cita envia datos fuera del contrato', async () => {
      await request(httpServer)
        .post('/appointments')
        .set('Authorization', bearer(managerToken))
        .send({
          startDateTime: '17-06-2030 12:00',
          clientId: seed.clientA.id,
          serviceId: seed.serviceA.id,
          specialistId: seed.specialistA.id,
          campoNoPermitido: true,
        })
        .expect(400);
    });
  });

  describe('HU-03/HU-04/HU-05 RNF-01 aislamiento de centros para gestor', () => {
    it('devuelve 403 cuando el gestor intenta operar sobre clientes, servicios o centros de otro centro', async () => {
      await request(httpServer)
        .get('/clients')
        .query({ centerId: seed.centerB.id })
        .set('Authorization', bearer(managerToken))
        .expect(403);

      await request(httpServer)
        .patch(`/services/${seed.serviceB.id}`)
        .set('Authorization', bearer(managerToken))
        .send({
          name: 'Servicio no permitido',
        })
        .expect(403);

      await request(httpServer)
        .get(`/centers/${seed.centerB.id}`)
        .set('Authorization', bearer(managerToken))
        .expect(403);
    });
  });

  describe('HU-08 RNF-01 portal del cliente', () => {
    it('permite reservar dentro del centro del cliente autenticado', async () => {
      const response = await request(httpServer)
        .post('/client-portal/appointments')
        .set('Authorization', bearer(clientToken))
        .send({
          startDateTime: `${futureDate}T11:30:00`,
          serviceId: seed.serviceA.id,
          specialistId: seed.specialistA.id,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        status: AppointmentStatus.SCHEDULED,
        center: {
          id: seed.centerA.id,
        },
        service: {
          id: seed.serviceA.id,
        },
        specialist: {
          id: seed.specialistA.id,
        },
      });
    });

    it('rechaza reservar servicios de otro centro desde el portal', async () => {
      await request(httpServer)
        .post('/client-portal/appointments')
        .set('Authorization', bearer(clientToken))
        .send({
          startDateTime: `${futureDate}T12:00:00`,
          serviceId: seed.serviceB.id,
          specialistId: seed.specialistB.id,
        })
        .expect(400);
    });
  });

  async function login(email: string, password: string): Promise<string> {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.access_token;
  }

  async function expectUser(
    id: number,
    expected: Partial<User> & { centerIds?: number[] },
  ) {
    const user = await dataSource.getRepository(User).findOne({
      where: { id },
      relations: { centers: true },
    });

    expect(user).toMatchObject({
      ...(expected.email ? { email: expected.email } : {}),
      ...(expected.name ? { name: expected.name } : {}),
      ...(expected.role ? { role: expected.role } : {}),
    });

    if (expected.centerIds) {
      expect(user?.centers?.map((center) => center.id).sort()).toEqual(
        expected.centerIds.sort(),
      );
    }
  }
});

function bearer(token: string): string {
  return `Bearer ${token}`;
}

async function recreateTestSchema() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      AppointmentRequest,
      Appointment,
      AvailabilityException,
      Availability,
      Center,
      Client,
      ServiceEntity,
      SpecialistAbsence,
      Specialist,
      User,
    ],
    synchronize: true,
    dropSchema: true,
  });

  await dataSource.initialize();
  await dataSource.destroy();
}

async function ensureTestDatabaseExists() {
  const database = process.env.DB_DATABASE;

  if (!database || !/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error(
      'DB_DATABASE/TEST_DB_DATABASE debe ser un identificador seguro compuesto por letras, numeros o guiones bajos',
    );
  }

  const maintenanceDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await maintenanceDataSource.initialize();

  try {
    const existingDatabase = await maintenanceDataSource.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (existingDatabase.length === 0) {
      await maintenanceDataSource.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await maintenanceDataSource.destroy();
  }
}

async function seedDatabase(dataSource: DataSource): Promise<SeedData> {
  const centerRepository = dataSource.getRepository(Center);
  const availabilityRepository = dataSource.getRepository(Availability);
  const userRepository = dataSource.getRepository(User);
  const specialistRepository = dataSource.getRepository(Specialist);
  const serviceRepository = dataSource.getRepository(ServiceEntity);
  const clientRepository = dataSource.getRepository(Client);

  const [centerA, centerB] = await centerRepository.save([
    centerRepository.create({
      name: 'Centro Integracion A',
      city: 'Madrid',
      active: true,
    }),
    centerRepository.create({
      name: 'Centro Integracion B',
      city: 'Valencia',
      active: true,
    }),
  ]);

  await availabilityRepository.save([
    availabilityRepository.create({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '13:00',
      center: centerA,
    }),
    availabilityRepository.create({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '13:00',
      center: centerB,
    }),
  ]);

  const [specialistA, specialistB] = await specialistRepository.save([
    specialistRepository.create({
      name: 'Especialista A',
      specialty: 'Fisioterapia',
      status: SpecialistStatus.ACTIVE,
      center: centerA,
    }),
    specialistRepository.create({
      name: 'Especialista B',
      specialty: 'Podologia',
      status: SpecialistStatus.ACTIVE,
      center: centerB,
    }),
  ]);

  const [serviceA, serviceB] = await serviceRepository.save([
    serviceRepository.create({
      name: 'Servicio A',
      durationMinutes: 30,
      price: 25,
      active: true,
      center: centerA,
      specialist: specialistA,
    }),
    serviceRepository.create({
      name: 'Servicio B',
      durationMinutes: 30,
      price: 25,
      active: true,
      center: centerB,
      specialist: specialistB,
    }),
  ]);

  const managerA = await userRepository.save(
    userRepository.create({
      email: 'gestor.a@app-citas.test',
      name: 'Gestor A',
      password: await bcrypt.hash('gestor1234', 10),
      role: UserRole.GESTOR,
      centers: [centerA],
      activeCenter: centerA,
    }),
  );

  const clientUser = await userRepository.save(
    userRepository.create({
      email: 'cliente.a@app-citas.test',
      name: 'Cliente A',
      password: await bcrypt.hash('cliente1234', 10),
      role: UserRole.CLIENT,
      centers: [centerA],
      activeCenter: centerA,
    }),
  );

  const [clientA, clientB] = await clientRepository.save([
    clientRepository.create({
      name: 'Cliente A',
      phone: '600000001',
      email: 'cliente.a@app-citas.test',
      active: true,
      center: centerA,
      user: clientUser,
    }),
    clientRepository.create({
      name: 'Cliente B',
      phone: '600000002',
      email: 'cliente.b@app-citas.test',
      active: true,
      center: centerB,
    }),
  ]);

  await userRepository.save(managerA);

  return {
    centerA,
    centerB,
    serviceA,
    serviceB,
    specialistA,
    specialistB,
    clientA,
    clientB,
  };
}
