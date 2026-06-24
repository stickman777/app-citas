import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager, Not } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from './appointments/appointment.entity';
import {
  AppointmentRequest,
  AppointmentRequestStatus,
} from './appointment-requests/appointment-request.entity';
import {
  AvailabilityException,
  AvailabilityExceptionType,
} from './availability/availability-exception.entity';
import { Availability } from './availability/availability.entity';
import { Center } from './centers/center.entity';
import { Client } from './clients/client.entity';
import {
  getClientInvitationExpirationDate,
  hashClientInvitationToken,
} from './common/client-invitation-token';
import { ServiceEntity } from './services/service.entity';
import { SpecialistAbsence } from './specialists/specialist-absence.entity';
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

interface SeedAppointmentRequest {
  clientKey: string;
  serviceKey: string;
  specialistKey: string;
  status: AppointmentRequestStatus;
  dayOffset: number;
  hour: number;
  minutes?: number;
  outsideAvailability: boolean;
  notes?: string;
  resolutionNote?: string;
}

interface SeedSpecialistAbsence {
  specialistKey: string;
  startDayOffset: number;
  endDayOffset: number;
  reason: string;
}

interface SeedAvailabilityException {
  centerKey: string;
  dayOffset: number;
  startTime: string;
  endTime: string;
  type: AvailabilityExceptionType;
  label: string;
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
  private readonly seedAvailabilityExceptions =
    this.buildSeedAvailabilityExceptions();
  private readonly seedManagers = this.buildSeedManagers();
  private readonly seedSpecialists = this.buildSeedSpecialists();
  private readonly seedSpecialistAbsences = this.buildSeedSpecialistAbsences();
  private readonly seedServices = this.buildSeedServices();
  private readonly seedClients = this.buildSeedClients();
  private readonly seedAppointments = this.buildSeedAppointments();
  private readonly seedAppointmentRequests =
    this.buildSeedAppointmentRequests();

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
    await manager
      .createQueryBuilder()
      .delete()
      .from(AppointmentRequest)
      .execute();
    await manager.createQueryBuilder().delete().from(Appointment).execute();
    await manager.createQueryBuilder().delete().from(ServiceEntity).execute();
    await manager
      .createQueryBuilder()
      .delete()
      .from(SpecialistAbsence)
      .execute();
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

    await this.createAvailabilityExceptions(manager, centers);
    await this.createManagers(manager, centers);

    const specialists = await this.createSpecialists(manager, centers);
    await this.createSpecialistAbsences(manager, specialists);

    const services = await this.createServices(manager, centers, specialists);
    const clients = await this.createClients(manager, centers);

    await this.createAppointments(
      manager,
      centers,
      clients,
      services,
      specialists,
    );
    await this.createAppointmentRequests(
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
    // Rangos de citas programadas ya creadas, para no generar solapes que
    // violarían las restricciones de exclusión de la tabla appointment.
    const scheduledRanges: {
      specialistId: number;
      clientId: number;
      start: number;
      end: number;
    }[] = [];

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

      const startDateTime = this.businessDayAt(
        seedAppointment.dayOffset,
        seedAppointment.hour,
        seedAppointment.minutes ?? 0,
      );
      const start = startDateTime.getTime();
      const end = start + service.durationMinutes * 60000;

      if (seedAppointment.status === AppointmentStatus.SCHEDULED) {
        const overlaps = scheduledRanges.some(
          (range) =>
            (range.specialistId === specialist.id ||
              range.clientId === client.id) &&
            start < range.end &&
            range.start < end,
        );

        if (overlaps) continue;

        scheduledRanges.push({
          specialistId: specialist.id,
          clientId: client.id,
          start,
          end,
        });
      }

      await manager.save(
        Appointment,
        manager.create(Appointment, {
          startDateTime,
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

  private async createAvailabilityExceptions(
    manager: EntityManager,
    centers: Map<string, Center>,
  ) {
    if (this.seedAvailabilityExceptions.length === 0) return;

    await manager.save(
      AvailabilityException,
      this.seedAvailabilityExceptions.map((exception) =>
        manager.create(AvailabilityException, {
          date: this.dateStringAt(exception.dayOffset),
          startTime: exception.startTime,
          endTime: exception.endTime,
          type: exception.type,
          label: exception.label,
          center: this.getSeedValue(centers, exception.centerKey),
        }),
      ),
    );
  }

  private async createSpecialistAbsences(
    manager: EntityManager,
    specialists: Map<string, Specialist>,
  ) {
    if (this.seedSpecialistAbsences.length === 0) return;

    await manager.save(
      SpecialistAbsence,
      this.seedSpecialistAbsences.map((absence) =>
        manager.create(SpecialistAbsence, {
          specialist: this.getSeedValue(specialists, absence.specialistKey),
          startDate: this.dateStringAt(absence.startDayOffset),
          endDate: this.dateStringAt(absence.endDayOffset),
          reason: absence.reason,
        }),
      ),
    );
  }

  private async createAppointmentRequests(
    manager: EntityManager,
    centers: Map<string, Center>,
    clients: Map<string, Client>,
    services: Map<string, ServiceEntity>,
    specialists: Map<string, Specialist>,
  ) {
    for (const seedRequest of this.seedAppointmentRequests) {
      const service = this.getSeedValue(services, seedRequest.serviceKey);
      const status = seedRequest.status;
      const isResolved = status !== AppointmentRequestStatus.PENDING;

      await manager.save(
        AppointmentRequest,
        manager.create(AppointmentRequest, {
          client: this.getSeedValue(clients, seedRequest.clientKey),
          service,
          specialist: this.getSeedValue(specialists, seedRequest.specialistKey),
          center: this.getSeedValue(
            centers,
            this.getCenterKeyForService(seedRequest.serviceKey),
          ),
          requestedStartDateTime: this.businessDayAt(
            seedRequest.dayOffset,
            seedRequest.hour,
            seedRequest.minutes ?? 0,
          ),
          outsideAvailability: seedRequest.outsideAvailability,
          notes: seedRequest.notes ?? null,
          status,
          resolvedAt: isResolved ? this.businessDayAt(-1, 12, 0) : null,
          resolutionNote: isResolved
            ? (seedRequest.resolutionNote ?? 'Solicitud revisada por gestion')
            : null,
        }),
      );
    }
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
        {
          key: 'norte-pediatria',
          name: 'Dra. Beatriz Ramos',
          specialty: 'Pediatria',
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
        {
          key: 'mediterraneo-podologia',
          name: 'Raul Campos',
          specialty: 'Podologia',
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
        {
          key: 'sierra-neuro',
          name: 'Dra. Silvia Herrero',
          specialty: 'Neurologia',
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
          description:
            'Valoración inicial, síntomas principales y plan básico.',
        },
        {
          name: 'Revisión general',
          description:
            'Seguimiento de evolución, tratamiento y próximos pasos.',
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
          description:
            'Valoración inicial, síntomas principales y plan básico.',
        },
        {
          name: 'Revisión general',
          description:
            'Seguimiento de evolución, tratamiento y próximos pasos.',
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
          description:
            'Valoración cardiovascular y revisión de factores de riesgo.',
        },
        {
          name: 'Revisión cardio',
          description:
            'Seguimiento de pruebas, tensión y tratamiento indicado.',
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

    const generatedClientsByCenter = this.buildGeneratedClientsByCenter();

    return this.seedCenters.flatMap((center) =>
      [
        ...clientsByCenter[center.key],
        ...generatedClientsByCenter[center.key],
      ].map((client) => ({
        ...client,
        centerKey: center.key,
      })),
    );
  }

  private buildGeneratedClientsByCenter(): Record<
    string,
    Omit<SeedClient, 'centerKey'>[]
  > {
    const namesByCenter: Record<string, string[]> = {
      norte: [
        'Alba Molina',
        'Jorge Castro',
        'Nerea Vidal',
        'Victor Saez',
        'Paula Roman',
        'Daniel Pardo',
        'Cristina Leon',
        'Mario Gil',
        'Teresa Cano',
        'Adrian Vega',
        'Natalia Rojas',
        'Sergio Mora',
        'Ines Alonso',
        'Guillermo Marin',
        'Laura Pons',
        'David Rey',
      ],
      mediterraneo: [
        'Alicia Navarro',
        'Hugo Blasco',
        'Eva Pascual',
        'Manuel Soto',
        'Julia Campos',
        'Ruben Fuentes',
        'Celia Ferrer',
        'Oscar Salas',
        'Irene Pastor',
        'Alvaro Costa',
        'Miriam Lozano',
        'Bruno Rivas',
        'Lorena Pujol',
        'Mateo Galan',
        'Sara Esteve',
        'Enrique Luna',
      ],
      sierra: [
        'Noelia Cruz',
        'Javier Nieto',
        'Rocio Aguilar',
        'Samuel Arias',
        'Patricia Vega',
        'Tomas Bravo',
        'Carmen Cabello',
        'Ivan Rubio',
        'Lidia Santos',
        'Pablo Merino',
        'Veronica Solis',
        'Hector Pena',
        'Marta Robles',
        'Raul Ortega',
        'Beatriz Carmona',
        'Diego Prieto',
      ],
    };
    const phonePrefixByCenter: Record<string, string> = {
      norte: '610',
      mediterraneo: '611',
      sierra: '612',
    };

    return Object.fromEntries(
      Object.entries(namesByCenter).map(([centerKey, names]) => [
        centerKey,
        names.map((name, index) => {
          const slug = this.slugify(`${centerKey}-${name}`);
          const email = `${slug}@clientes.seed.local`;
          const accountIndex = index % 8 === 0;
          const invitationIndex = index % 8 === 3;

          return {
            key: `${centerKey}-cliente-${index + 1}`,
            name,
            phone: `${phonePrefixByCenter[centerKey]}${String(index + 100001).slice(-6)}`,
            email,
            notes:
              index % 5 === 0
                ? 'Cliente recurrente con varias citas historicas'
                : undefined,
            priority: index % 7 === 0 ? 2 : index % 3 === 0 ? 1 : 0,
            account: accountIndex
              ? {
                  email,
                  password: 'cliente1234',
                }
              : undefined,
            invitationToken: invitationIndex
              ? `seed-invite-${centerKey}-${index + 1}`
              : undefined,
          };
        }),
      ]),
    );
  }

  private buildSeedAppointments(): SeedAppointment[] {
    const appointments: SeedAppointment[] = [];

    this.seedClients.forEach((client, clientIndex) => {
      const centerServices = this.seedServices.filter(
        (service) => service.centerKey === client.centerKey,
      );
      const appointmentCount = 8 + (clientIndex % 3);

      for (let index = 0; index < appointmentCount; index += 1) {
        const service =
          centerServices[(clientIndex * 2 + index) % centerServices.length];
        const isPastAppointment = index < 5;
        const status = isPastAppointment
          ? this.pickPastAppointmentStatus(clientIndex, index)
          : this.pickFutureAppointmentStatus(clientIndex, index);
        const dayOffset = isPastAppointment
          ? -(7 + clientIndex * 2 + index * 9)
          : 2 + ((clientIndex * 3 + index * 5) % 70);
        const outsideAvailability = (clientIndex + index) % 9 === 0;
        const appointmentTime = outsideAvailability
          ? this.pickOutsideAvailabilityTime(
              client.centerKey,
              appointments.length,
            )
          : this.pickInsideAvailabilityTime(
              client.centerKey,
              dayOffset,
              service.durationMinutes,
              clientIndex + index * 3,
            );

        appointments.push({
          clientKey: client.key,
          serviceKey: service.key,
          specialistKey: service.specialistKey,
          status,
          dayOffset,
          hour: appointmentTime.hour,
          minutes: appointmentTime.minutes,
          outsideAvailability,
        });
      }
    });

    return appointments;
  }

  private pickPastAppointmentStatus(
    clientIndex: number,
    appointmentIndex: number,
  ): AppointmentStatus {
    return (clientIndex + appointmentIndex) % 5 === 2
      ? AppointmentStatus.CANCELLED
      : AppointmentStatus.COMPLETED;
  }

  private pickFutureAppointmentStatus(
    clientIndex: number,
    appointmentIndex: number,
  ): AppointmentStatus {
    return (clientIndex + appointmentIndex) % 4 === 0
      ? AppointmentStatus.CANCELLED
      : AppointmentStatus.SCHEDULED;
  }

  private buildSeedAppointmentRequests(): SeedAppointmentRequest[] {
    return this.seedClients
      .filter((_, clientIndex) => clientIndex % 2 === 0)
      .slice(0, 30)
      .map((client, requestIndex) => {
        const centerServices = this.seedServices.filter(
          (service) => service.centerKey === client.centerKey,
        );
        const service =
          centerServices[(requestIndex + 3) % centerServices.length];
        const outsideAvailability = requestIndex % 2 === 0;
        const occupiedAppointment = outsideAvailability
          ? undefined
          : this.seedAppointments.find(
              (appointment) =>
                appointment.serviceKey === service.key &&
                appointment.status === AppointmentStatus.SCHEDULED,
            );
        const dayOffset = occupiedAppointment?.dayOffset ?? 12 + requestIndex;
        const requestTime = outsideAvailability
          ? this.pickOutsideAvailabilityTime(client.centerKey, requestIndex)
          : occupiedAppointment
            ? {
                hour: occupiedAppointment.hour,
                minutes: occupiedAppointment.minutes ?? 0,
              }
            : this.pickInsideAvailabilityTime(
                client.centerKey,
                dayOffset,
                service.durationMinutes,
                requestIndex,
              );
        const rejected = requestIndex % 5 === 4;

        return {
          clientKey: client.key,
          serviceKey: service.key,
          specialistKey: service.specialistKey,
          status: rejected
            ? AppointmentRequestStatus.REJECTED
            : AppointmentRequestStatus.PENDING,
          dayOffset,
          hour: requestTime.hour,
          minutes: requestTime.minutes,
          outsideAvailability,
          notes: outsideAvailability
            ? 'Solicitud fuera del horario habitual'
            : 'Solicitud porque el hueco preferido estaba ocupado',
          resolutionNote: rejected
            ? 'No se confirma por falta de disponibilidad'
            : undefined,
        };
      });
  }

  private buildSeedSpecialistAbsences(): SeedSpecialistAbsence[] {
    return this.seedSpecialists
      .filter((_, specialistIndex) => specialistIndex % 2 === 0)
      .map((specialist, specialistIndex) => ({
        specialistKey: specialist.key,
        startDayOffset: 95 + specialistIndex * 4,
        endDayOffset: 96 + specialistIndex * 4,
        reason: specialistIndex % 3 === 0 ? 'Formacion externa' : 'Vacaciones',
      }));
  }

  private buildSeedAvailabilityExceptions(): SeedAvailabilityException[] {
    return this.seedCenters.flatMap((center, centerIndex) => [
      {
        centerKey: center.key,
        dayOffset: 90 + centerIndex * 6,
        startTime: '12:00',
        endTime: '14:00',
        type: AvailabilityExceptionType.BLOCKED,
        label: 'Bloqueo por mantenimiento',
      },
      {
        centerKey: center.key,
        dayOffset: 93 + centerIndex * 6,
        startTime: '09:00',
        endTime: '13:00',
        type: AvailabilityExceptionType.EXTRA_AVAILABLE,
        label: 'Apertura extraordinaria',
      },
    ]);
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

  private dateStringAt(dayOffset: number) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);

    return this.toDateString(date);
  }

  private toDateString(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '');
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
