import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointments/appointment.entity';
import { Availability } from './availability/availability.entity';
import { Center } from './centers/center.entity';
import { Client } from './clients/client.entity';
import { ServiceEntity } from './services/service.entity';
import { Specialist } from './specialists/specialist.entity';

@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.seedDemoData();
  }

  private async seedDemoData() {
    if (process.env.SEED_DEMO_DATA === 'false') return;

    const centerRepository = this.dataSource.getRepository(Center);
    const existingCenters = await centerRepository.count();

    if (existingCenters > 0) return;

    await this.dataSource.transaction(async (manager) => {
      const center = await manager.save(
        Center,
        manager.create(Center, {
          name: 'Centro Demo Madrid',
          city: 'Madrid',
        }),
      );

      await manager.save(
        Availability,
        [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
          manager.create(Availability, {
            dayOfWeek,
            startTime: '09:00',
            endTime: '14:00',
            center,
          }),
          manager.create(Availability, {
            dayOfWeek,
            startTime: '16:00',
            endTime: '20:00',
            center,
          }),
        ]),
      );

      const [generalSpecialist, physiotherapist] = await manager.save(
        Specialist,
        [
          manager.create(Specialist, {
            name: 'Dra. Laura Gomez',
            specialty: 'Medicina general',
            center,
          }),
          manager.create(Specialist, {
            name: 'Carlos Ruiz',
            specialty: 'Fisioterapia',
            center,
          }),
        ],
      );

      const [generalConsultation, physiotherapy] = await manager.save(
        ServiceEntity,
        [
          manager.create(ServiceEntity, {
            name: 'Consulta general',
            description: 'Primera valoracion y seguimiento',
            durationMinutes: 30,
            price: 45,
            center,
            specialist: generalSpecialist,
          }),
          manager.create(ServiceEntity, {
            name: 'Fisioterapia',
            description: 'Sesion individual de fisioterapia',
            durationMinutes: 45,
            price: 55,
            center,
            specialist: physiotherapist,
          }),
        ],
      );

      const [demoClient, secondClient] = await manager.save(
        Client,
        [
          manager.create(Client, {
            name: 'Ana Martinez',
            phone: '600123456',
            email: 'ana.martinez@example.com',
            notes: 'Cliente demo',
            priority: 1,
            center,
          }),
          manager.create(Client, {
            name: 'Luis Garcia',
            phone: '600654321',
            email: 'luis.garcia@example.com',
            priority: 0,
            center,
          }),
        ],
      );

      await manager.save(
        Appointment,
        [
          manager.create(Appointment, {
            startDateTime: this.nextBusinessDayAt(10, 0),
            duration: generalConsultation.durationMinutes,
            outsideAvailability: false,
            status: AppointmentStatus.SCHEDULED,
            client: demoClient,
            service: generalConsultation,
            center,
            specialist: generalSpecialist,
          }),
          manager.create(Appointment, {
            startDateTime: this.nextBusinessDayAt(10, 0),
            duration: physiotherapy.durationMinutes,
            outsideAvailability: false,
            status: AppointmentStatus.SCHEDULED,
            client: secondClient,
            service: physiotherapy,
            center,
            specialist: physiotherapist,
          }),
          manager.create(Appointment, {
            startDateTime: this.nextBusinessDayAt(11, 0),
            duration: physiotherapy.durationMinutes,
            outsideAvailability: false,
            status: AppointmentStatus.SCHEDULED,
            client: demoClient,
            service: physiotherapy,
            center,
            specialist: physiotherapist,
          }),
        ],
      );
    });

    this.logger.log('Seed demo creado correctamente');
  }

  private nextBusinessDayAt(hours: number, minutes: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);

    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }
}
