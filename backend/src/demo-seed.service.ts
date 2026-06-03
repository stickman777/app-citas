import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager, Not } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from './appointments/appointment.entity';
import { AvailabilityException } from './availability/availability-exception.entity';
import { Availability } from './availability/availability.entity';
import { Center } from './centers/center.entity';
import { Client } from './clients/client.entity';
import {
  getClientInvitationExpirationDate,
  hashClientInvitationToken,
} from './common/client-invitation-token';
import { ServiceEntity } from './services/service.entity';
import { Specialist } from './specialists/specialist.entity';
import { User, UserRole } from './users/user.entity';

interface SeedCenter {
  key: string;
  name: string;
  city: string;
  logoUrl: string;
  availabilitySlots: SeedAvailabilitySlot[];
}

interface SeedAvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface SeedManager {
  centerKey: string;
  name: string;
  email: string;
  password: string;
}

interface SeedSpecialist {
  key: string;
  centerKey: string;
  name: string;
  specialty: string;
}

interface SeedService {
  key: string;
  centerKey: string;
  specialistKey: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

interface SeedClient {
  key: string;
  centerKey: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  priority?: number;
  account?: {
    email: string;
    password: string;
  };
  invitationToken?: string;
}

interface SeedAppointment {
  clientKey: string;
  serviceKey: string;
  specialistKey: string;
  status: AppointmentStatus;
  dayOffset: number;
  hour: number;
  minutes?: number;
  outsideAvailability?: boolean;
}

@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);
  private readonly seedCenters: SeedCenter[] = [
    {
      key: 'norte',
      name: 'Clínica Norte Salud',
      city: 'Madrid',
      logoUrl: 'assets/img/icons/clinic-01.svg',
      availabilitySlots: [
        ...this.buildWeekdayAvailabilitySlots('08:30', '14:00'),
        ...this.buildWeekdayAvailabilitySlots('16:00', '20:00'),
        { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
      ],
    },
    {
      key: 'mediterraneo',
      name: 'Centro Médico Mediterráneo',
      city: 'Valencia',
      logoUrl: 'assets/img/icons/clinic-04.svg',
      availabilitySlots: [
        ...[1, 2, 3, 4].flatMap((dayOfWeek) => [
          { dayOfWeek, startTime: '09:00', endTime: '14:00' },
          { dayOfWeek, startTime: '15:30', endTime: '20:30' },
        ]),
        { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
      ],
    },
    {
      key: 'sierra',
      name: 'Instituto Salud Sierra',
      city: 'Granada',
      logoUrl: 'assets/img/icons/clinic-07.svg',
      availabilitySlots: [
        ...this.buildWeekdayAvailabilitySlots('08:00', '15:00'),
        { dayOfWeek: 2, startTime: '16:30', endTime: '19:30' },
        { dayOfWeek: 4, startTime: '16:30', endTime: '19:30' },
      ],
    },
  ];
  private readonly seedManagers = this.buildSeedManagers();
  private readonly seedSpecialists = this.buildSeedSpecialists();
  private readonly seedServices = this.buildSeedServices();
  private readonly seedClients = this.buildSeedClients();
  private readonly seedAppointments = this.buildSeedAppointments();

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.seedDemoData();
  }

  private async seedDemoData() {
    if (process.env.SEED_DEMO_DATA !== 'true') return;

    const shouldReset = process.env.SEED_RESET_DATA === 'true';
    const centerRepository = this.dataSource.getRepository(Center);
    const existingCenters = await centerRepository.count();

    if (!shouldReset && existingCenters > 0) {
      this.logger.log('Seed demo omitido: ya existen centros');
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      if (shouldReset) {
        await this.resetFunctionalData(manager);
      }

      await this.createDemoData(manager);
    });

    this.logger.log(
      shouldReset
        ? 'Base de datos demo reiniciada correctamente'
        : 'Seed demo creado correctamente',
    );
  }

  private async resetFunctionalData(manager: EntityManager) {
    await this.detachAdminFromCenters(manager);
    await manager.createQueryBuilder().delete().from(Appointment).execute();
    await manager.createQueryBuilder().delete().from(ServiceEntity).execute();
    await manager.createQueryBuilder().delete().from(Specialist).execute();
    await manager.createQueryBuilder().delete().from(Client).execute();
    await manager
      .createQueryBuilder()
      .delete()
      .from(AvailabilityException)
      .execute();
    await manager.createQueryBuilder().delete().from(Availability).execute();

    const nonAdminUsers = await manager.find(User, {
      relations: {
        centers: true,
        activeCenter: true,
      },
      where: {
        role: Not(UserRole.ADMIN),
      },
    });

    if (nonAdminUsers.length > 0) {
      await manager.remove(User, nonAdminUsers);
    }

    await manager.createQueryBuilder().delete().from(Center).execute();
  }

  private async detachAdminFromCenters(manager: EntityManager) {
    const adminUsers = await manager.find(User, {
      relations: {
        centers: true,
        activeCenter: true,
      },
      where: {
        role: UserRole.ADMIN,
      },
    });

    for (const admin of adminUsers) {
      admin.centers = [];
      admin.activeCenter = null;
    }

    if (adminUsers.length > 0) {
      await manager.save(User, adminUsers);
    }
  }

  private async createDemoData(manager: EntityManager) {
    const centers = await this.createCenters(manager);

    await this.createManagers(manager, centers);

    const specialists = await this.createSpecialists(manager, centers);
    const services = await this.createServices(manager, centers, specialists);
    const clients = await this.createClients(manager, centers);

    await this.createAppointments(
      manager,
      centers,
      clients,
      services,
      specialists,
    );
  }

  private async createCenters(manager: EntityManager) {
    const centers = new Map<string, Center>();

    for (const seedCenter of this.seedCenters) {
      const center = await manager.save(
        Center,
        manager.create(Center, {
          name: seedCenter.name,
          city: seedCenter.city,
          logoUrl: seedCenter.logoUrl,
          active: true,
        }),
      );

      await this.createDefaultAvailability(manager, center, seedCenter);
      centers.set(seedCenter.key, center);
    }

    return centers;
  }

  private async createManagers(
    manager: EntityManager,
    centers: Map<string, Center>,
  ) {
    for (const seedManager of this.seedManagers) {
      const center = this.getSeedValue(centers, seedManager.centerKey);

      await manager.save(
        User,
        manager.create(User, {
          email: seedManager.email,
          name: seedManager.name,
          password: await bcrypt.hash(seedManager.password, 10),
          role: UserRole.GESTOR,
          centers: [center],
          activeCenter: center,
        }),
      );
    }
  }

  private async createSpecialists(
    manager: EntityManager,
    centers: Map<string, Center>,
  ) {
    const specialists = new Map<string, Specialist>();

    for (const seedSpecialist of this.seedSpecialists) {
      const center = this.getSeedValue(centers, seedSpecialist.centerKey);
      const specialist = await manager.save(
        Specialist,
        manager.create(Specialist, {
          name: seedSpecialist.name,
          specialty: seedSpecialist.specialty,
          center,
        }),
      );

      specialists.set(seedSpecialist.key, specialist);
    }

    return specialists;
  }

  private async createServices(
    manager: EntityManager,
    centers: Map<string, Center>,
    specialists: Map<string, Specialist>,
  ) {
    const services = new Map<string, ServiceEntity>();

    for (const seedService of this.seedServices) {
      const center = this.getSeedValue(centers, seedService.centerKey);
      const specialist = this.getSeedValue(
        specialists,
        seedService.specialistKey,
      );
      const service = await manager.save(
        ServiceEntity,
        manager.create(ServiceEntity, {
          name: seedService.name,
          description: seedService.description,
          durationMinutes: seedService.durationMinutes,
          price: seedService.price,
          center,
          specialist,
        }),
      );

      services.set(seedService.key, service);
    }

    return services;
  }

  private async createClients(
    manager: EntityManager,
    centers: Map<string, Center>,
  ) {
    const clients = new Map<string, Client>();

    for (const seedClient of this.seedClients) {
      const center = this.getSeedValue(centers, seedClient.centerKey);
      const client = await manager.save(
        Client,
        manager.create(Client, {
          name: seedClient.name,
          phone: seedClient.phone,
          email: seedClient.email,
          notes: seedClient.notes,
          priority: seedClient.priority ?? 0,
          center,
        }),
      );

      if (seedClient.account) {
        const user = await manager.save(
          User,
          manager.create(User, {
            email: seedClient.account.email,
            name: seedClient.name,
            password: await bcrypt.hash(seedClient.account.password, 10),
            role: UserRole.CLIENT,
            centers: [center],
            activeCenter: center,
          }),
        );

        client.user = user;
        await manager.save(Client, client);
      } else if (seedClient.invitationToken) {
        client.invitationTokenHash = hashClientInvitationToken(
          seedClient.invitationToken,
        );
        client.invitationExpiresAt = getClientInvitationExpirationDate();
        await manager.save(Client, client);
      }

      clients.set(seedClient.key, client);
    }

    return clients;
  }

  private async createAppointments(
    manager: EntityManager,
    centers: Map<string, Center>,
    clients: Map<string, Client>,
    services: Map<string, ServiceEntity>,
    specialists: Map<string, Specialist>,
  ) {
    for (const seedAppointment of this.seedAppointments) {
      const client = this.getSeedValue(clients, seedAppointment.clientKey);
      const service = this.getSeedValue(services, seedAppointment.serviceKey);
      const specialist = this.getSeedValue(
        specialists,
        seedAppointment.specialistKey,
      );
      const center = this.getSeedValue(
        centers,
        this.getCenterKeyForService(seedAppointment.serviceKey),
      );

      await manager.save(
        Appointment,
        manager.create(Appointment, {
          startDateTime: this.businessDayAt(
            seedAppointment.dayOffset,
            seedAppointment.hour,
            seedAppointment.minutes ?? 0,
          ),
          duration: service.durationMinutes,
          outsideAvailability: seedAppointment.outsideAvailability ?? false,
          status: seedAppointment.status,
          client,
          service,
          center,
          specialist,
        }),
      );
    }
  }

  private async createDefaultAvailability(
    manager: EntityManager,
    center: Center,
    seedCenter: SeedCenter,
  ) {
    await manager.save(
      Availability,
      seedCenter.availabilitySlots.map((slot) =>
        manager.create(Availability, {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          center,
        }),
      ),
    );
  }

  private buildSeedManagers(): SeedManager[] {
    const managersByCenter: Record<string, Omit<SeedManager, 'centerKey'>[]> = {
      norte: [
        {
          name: 'Marta Delgado',
          email: 'marta.delgado@nortesalud.local',
          password: 'gestor1234',
        },
        {
          name: 'Sergio Molina',
          email: 'sergio.molina@nortesalud.local',
          password: 'gestor1234',
        },
      ],
      mediterraneo: [
        {
          name: 'Lucia Benitez',
          email: 'lucia.benitez@mediterraneo.local',
          password: 'gestor1234',
        },
        {
          name: 'Andres Vidal',
          email: 'andres.vidal@mediterraneo.local',
          password: 'gestor1234',
        },
      ],
      sierra: [
        {
          name: 'Elena Castro',
          email: 'elena.castro@saludsierra.local',
          password: 'gestor1234',
        },
        {
          name: 'Ramon Ortega',
          email: 'ramon.ortega@saludsierra.local',
          password: 'gestor1234',
        },
      ],
    };

    return this.seedCenters.flatMap((center) =>
      managersByCenter[center.key].map((manager) => ({
        ...manager,
        centerKey: center.key,
      })),
    );
  }

  private buildSeedSpecialists(): SeedSpecialist[] {
    const specialistsByCenter: Record<
      string,
      Omit<SeedSpecialist, 'centerKey'>[]
    > = {
      norte: [
        {
          key: 'norte-general',
          name: 'Dra. Laura Gómez',
          specialty: 'Medicina general',
        },
        {
          key: 'norte-fisio',
          name: 'Carlos Ruiz',
          specialty: 'Fisioterapia',
        },
        {
          key: 'norte-psico',
          name: 'Dra. Irene Navarro',
          specialty: 'Psicología clínica',
        },
      ],
      mediterraneo: [
        {
          key: 'mediterraneo-general',
          name: 'Dr. Javier Soler',
          specialty: 'Medicina familiar',
        },
        {
          key: 'mediterraneo-derma',
          name: 'Dra. Marta Vidal',
          specialty: 'Dermatología',
        },
        {
          key: 'mediterraneo-nutri',
          name: 'Nuria Ferrer',
          specialty: 'Nutrición',
        },
      ],
      sierra: [
        {
          key: 'sierra-general',
          name: 'Dra. Carmen Ríos',
          specialty: 'Medicina general',
        },
        {
          key: 'sierra-trauma',
          name: 'Dr. Álvaro Molina',
          specialty: 'Traumatología',
        },
        {
          key: 'sierra-cardio',
          name: 'Dra. Patricia León',
          specialty: 'Cardiología',
        },
      ],
    };

    return this.seedCenters.flatMap((center) =>
      specialistsByCenter[center.key].map((specialist) => ({
        ...specialist,
        centerKey: center.key,
      })),
    );
  }

  private buildSeedServices(): SeedService[] {
    const serviceDetailsBySpecialist: Record<
      string,
      [
        Pick<SeedService, 'name' | 'description'>,
        Pick<SeedService, 'name' | 'description'>,
      ]
    > = {
      'norte-general': [
        {
          name: 'Consulta general',
          description: 'Valoración inicial, síntomas principales y plan básico.',
        },
        {
          name: 'Revisión general',
          description: 'Seguimiento de evolución, tratamiento y próximos pasos.',
        },
      ],
      'norte-fisio': [
        {
          name: 'Sesión fisio',
          description: 'Tratamiento manual y pauta breve de ejercicios.',
        },
        {
          name: 'Revisión fisio',
          description: 'Control de movilidad, dolor y ajuste de ejercicios.',
        },
      ],
      'norte-psico': [
        {
          name: 'Consulta psicología',
          description: 'Primera valoración emocional y objetivos terapéuticos.',
        },
        {
          name: 'Revisión psicología',
          description: 'Seguimiento de objetivos, pautas y evolución personal.',
        },
      ],
      'mediterraneo-general': [
        {
          name: 'Consulta familiar',
          description: 'Atención médica general y revisión de antecedentes.',
        },
        {
          name: 'Revisión familiar',
          description: 'Control posterior de síntomas, pruebas o medicación.',
        },
      ],
      'mediterraneo-derma': [
        {
          name: 'Consulta derma',
          description: 'Revisión de piel, lesiones o molestias dermatológicas.',
        },
        {
          name: 'Revisión derma',
          description: 'Seguimiento de tratamiento y evolución de lesiones.',
        },
      ],
      'mediterraneo-nutri': [
        {
          name: 'Plan nutrición',
          description: 'Evaluación de hábitos y propuesta nutricional inicial.',
        },
        {
          name: 'Revisión nutrición',
          description: 'Control de adherencia, medidas y ajustes del plan.',
        },
      ],
      'sierra-general': [
        {
          name: 'Consulta general',
          description: 'Valoración inicial, síntomas principales y plan básico.',
        },
        {
          name: 'Revisión general',
          description: 'Seguimiento de evolución, tratamiento y próximos pasos.',
        },
      ],
      'sierra-trauma': [
        {
          name: 'Consulta trauma',
          description: 'Evaluación de lesión, dolor o limitación funcional.',
        },
        {
          name: 'Revisión trauma',
          description: 'Control de recuperación, pruebas y pauta de actividad.',
        },
      ],
      'sierra-cardio': [
        {
          name: 'Consulta cardio',
          description: 'Valoración cardiovascular y revisión de factores de riesgo.',
        },
        {
          name: 'Revisión cardio',
          description: 'Seguimiento de pruebas, tensión y tratamiento indicado.',
        },
      ],
    };

    return this.seedSpecialists.flatMap((specialist) => {
      const [firstVisit, followUp] = serviceDetailsBySpecialist[
        specialist.key
      ] ?? [
        {
          name: 'Primera visita',
          description: `Valoración inicial de ${specialist.specialty.toLowerCase()}`,
        },
        {
          name: 'Seguimiento',
          description: `Consulta de seguimiento de ${specialist.specialty.toLowerCase()}`,
        },
      ];

      return [
        {
          key: `${specialist.key}-primera`,
          centerKey: specialist.centerKey,
          specialistKey: specialist.key,
          name: firstVisit.name,
          description: firstVisit.description,
          durationMinutes: 30,
          price: 45,
        },
        {
          key: `${specialist.key}-seguimiento`,
          centerKey: specialist.centerKey,
          specialistKey: specialist.key,
          name: followUp.name,
          description: followUp.description,
          durationMinutes: 20,
          price: 32,
        },
      ];
    });
  }

  private buildSeedClients(): SeedClient[] {
    const clientsByCenter: Record<string, Omit<SeedClient, 'centerKey'>[]> = {
      norte: [
        {
          key: 'ana',
          name: 'Ana Martínez',
          phone: '600123456',
          email: 'ana.martinez@example.com',
          notes: 'Cliente con cuenta móvil',
          priority: 1,
          account: {
            email: 'ana.martinez@example.com',
            password: 'cliente1234',
          },
        },
        {
          key: 'luis',
          name: 'Luis García',
          phone: '600654321',
          email: 'luis.garcia@example.com',
          notes: 'Invitacion de registro pendiente',
          invitationToken: 'seed-invite-luis-garcia',
        },
        {
          key: 'sofia',
          name: 'Sofía Romero',
          phone: '600111222',
          email: 'sofia.romero@example.com',
          priority: 2,
        },
        {
          key: 'marcos',
          name: 'Marcos Ortega',
          phone: '600333444',
          email: 'marcos.ortega@example.com',
        },
      ],
      mediterraneo: [
        {
          key: 'clara',
          name: 'Clara Sánchez',
          phone: '601222333',
          email: 'clara.sanchez@example.com',
          notes: 'Cliente con cuenta móvil',
          account: {
            email: 'clara.sanchez@example.com',
            password: 'cliente1234',
          },
        },
        {
          key: 'diego',
          name: 'Diego Molina',
          phone: '601444555',
          email: 'diego.molina@example.com',
          notes: 'Invitacion de registro pendiente',
          invitationToken: 'seed-invite-diego-molina',
        },
        {
          key: 'elena',
          name: 'Elena Torres',
          phone: '601666777',
          email: 'elena.torres@example.com',
          priority: 1,
        },
        {
          key: 'pablo',
          name: 'Pablo Herrera',
          phone: '601888999',
          email: 'pablo.herrera@example.com',
        },
      ],
      sierra: [
        {
          key: 'marta',
          name: 'Marta Campos',
          phone: '602111333',
          email: 'marta.campos@example.com',
          notes: 'Cliente con cuenta móvil',
          account: {
            email: 'marta.campos@example.com',
            password: 'cliente1234',
          },
        },
        {
          key: 'ivan',
          name: 'Iván Serrano',
          phone: '602222444',
          email: 'ivan.serrano@example.com',
          notes: 'Invitacion de registro pendiente',
          invitationToken: 'seed-invite-ivan-serrano',
        },
        {
          key: 'raquel',
          name: 'Raquel Núñez',
          phone: '602555777',
          email: 'raquel.nunez@example.com',
          priority: 2,
        },
        {
          key: 'hector',
          name: 'Héctor Prieto',
          phone: '602888000',
          email: 'hector.prieto@example.com',
        },
      ],
    };

    return this.seedCenters.flatMap((center) =>
      clientsByCenter[center.key].map((client) => ({
        ...client,
        centerKey: center.key,
      })),
    );
  }

  private buildSeedAppointments(): SeedAppointment[] {
    const appointments: SeedAppointment[] = [];
    const statuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ];

    this.seedClients.forEach((client, clientIndex) => {
      const centerServices = this.seedServices.filter(
        (service) => service.centerKey === client.centerKey,
      );
      const appointmentCount = (clientIndex % 5) + 1;

      for (let index = 0; index < appointmentCount; index += 1) {
        const service =
          centerServices[(clientIndex + index) % centerServices.length];
        const outsideAvailability = appointments.length % 4 === 3;
        const appointmentTime = outsideAvailability
          ? this.pickOutsideAvailabilityTime(client.centerKey, appointments.length)
          : this.pickInsideAvailabilityTime(
              client.centerKey,
              index % 2 === 0 ? index + 1 : -(index + 1),
              service.durationMinutes,
              clientIndex + index,
            );

        appointments.push({
          clientKey: client.key,
          serviceKey: service.key,
          specialistKey: service.specialistKey,
          status: statuses[(clientIndex + index) % statuses.length],
          dayOffset: index % 2 === 0 ? index + 1 : -(index + 1),
          hour: appointmentTime.hour,
          minutes: appointmentTime.minutes,
          outsideAvailability,
        });
      }
    });

    return appointments;
  }

  private buildWeekdayAvailabilitySlots(
    startTime: string,
    endTime: string,
  ): SeedAvailabilitySlot[] {
    return [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startTime,
      endTime,
    }));
  }

  private pickInsideAvailabilityTime(
    centerKey: string,
    dayOffset: number,
    durationMinutes: number,
    seedIndex: number,
  ) {
    const dayOfWeek = this.businessDayAt(dayOffset, 12, 0).getDay();
    const slots = this.getSeedCenter(centerKey).availabilitySlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek,
    );
    const slot = slots[seedIndex % slots.length];
    const slotStartMinutes = this.parseTimeToMinutes(slot.startTime);
    const latestStartMinutes =
      this.parseTimeToMinutes(slot.endTime) - durationMinutes;
    const availableRange = Math.max(latestStartMinutes - slotStartMinutes, 0);
    const offset = Math.min(60 + (seedIndex % 5) * 30, availableRange);

    return this.toTimeParts(slotStartMinutes + offset);
  }

  private pickOutsideAvailabilityTime(centerKey: string, seedIndex: number) {
    const timesByCenter: Record<string, { hour: number; minutes: number }[]> = {
      norte: [
        { hour: 7, minutes: 45 },
        { hour: 20, minutes: 30 },
      ],
      mediterraneo: [
        { hour: 8, minutes: 15 },
        { hour: 21, minutes: 0 },
      ],
      sierra: [
        { hour: 7, minutes: 30 },
        { hour: 19, minutes: 45 },
      ],
    };
    const times = timesByCenter[centerKey] ?? [{ hour: 21, minutes: 0 }];

    return times[seedIndex % times.length];
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private toTimeParts(totalMinutes: number) {
    return {
      hour: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  }

  private businessDayAt(dayOffset: number, hours: number, minutes: number) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);

    const direction = dayOffset < 0 ? -1 : 1;

    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + direction);
    }

    return date;
  }

  private getCenterKeyForService(serviceKey: string) {
    const service = this.seedServices.find(
      (seedService) => seedService.key === serviceKey,
    );

    if (!service) throw new Error(`Servicio seed no encontrado: ${serviceKey}`);

    return service.centerKey;
  }

  private getSeedCenter(centerKey: string): SeedCenter {
    const center = this.seedCenters.find(
      (seedCenter) => seedCenter.key === centerKey,
    );

    if (!center) throw new Error(`Centro seed no encontrado: ${centerKey}`);

    return center;
  }

  private getSeedValue<T>(values: Map<string, T>, key: string): T {
    const value = values.get(key);

    if (!value) throw new Error(`Referencia seed no encontrada: ${key}`);

    return value;
  }
}
