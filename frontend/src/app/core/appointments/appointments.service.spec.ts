import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentPayload,
  AppointmentsService,
} from './appointments.service';

describe('AppointmentsService - HU-07', () => {
  let service: AppointmentsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/appointments`;

  const appointment: Appointment = {
    id: 1,
    startDateTime: '2030-06-17T09:00:00',
    duration: 30,
    outsideAvailability: false,
    status: 'SCHEDULED',
    client: {
      id: 10,
      name: 'Ana',
      phone: '600000000',
      active: true,
      priority: 0,
    },
    service: {
      id: 20,
      name: 'Fisioterapia',
      durationMinutes: 30,
      active: true,
    },
    center: {
      id: 1,
      name: 'Centro Norte',
      active: true,
      createdAt: '2030-01-01T00:00:00',
      updatedAt: '2030-01-01T00:00:00',
    },
    specialist: {
      id: 30,
      name: 'Dra. Lopez',
      status: 'ACTIVE',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AppointmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('HU-07: construye GET de citas con filtro de centro y procesa la respuesta', done => {
    service.getAppointments(1).subscribe(result => {
      expect(result).toEqual([appointment]);
      done();
    });

    const request = httpMock.expectOne(
      req =>
        req.method === 'GET' &&
        req.url === apiUrl &&
        req.params.get('centerId') === '1',
    );

    request.flush([appointment]);
  });

  it('HU-07: construye POST de creacion con el payload exacto', done => {
    const payload: AppointmentPayload = {
      startDateTime: '2030-06-17T09:00:00',
      clientId: 10,
      serviceId: 20,
      specialistId: 30,
    };

    service.createAppointment(payload).subscribe(result => {
      expect(result).toEqual(appointment);
      done();
    });

    const request = httpMock.expectOne(apiUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(appointment);
  });

  it('HU-07: construye GET de huecos disponibles con fecha, servicio y especialista', done => {
    service.getAvailableSlots('2030-06-17', 20, 30).subscribe(result => {
      expect(result).toEqual(['09:00', '09:30']);
      done();
    });

    const request = httpMock.expectOne(
      req =>
        req.method === 'GET' &&
        req.url === `${apiUrl}/available-slots` &&
        req.params.get('date') === '2030-06-17' &&
        req.params.get('serviceId') === '20' &&
        req.params.get('specialistId') === '30',
    );

    request.flush(['09:00', '09:30']);
  });

  it('HU-07: construye PATCH de reprogramacion y procesa la cita devuelta', done => {
    const updatedAppointment: Appointment = {
      ...appointment,
      startDateTime: '2030-06-17T10:00:00',
    };
    const payload = {
      startDateTime: '2030-06-17T10:00:00',
    };

    service.reschedule(1, payload).subscribe(result => {
      expect(result).toEqual(updatedAppointment);
      done();
    });

    const request = httpMock.expectOne(`${apiUrl}/1/reschedule`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(payload);
    request.flush(updatedAppointment);
  });

  it('HU-07: construye PATCH de cancelacion con cuerpo vacio', done => {
    const cancelledAppointment: Appointment = {
      ...appointment,
      status: 'CANCELLED',
    };

    service.cancel(1).subscribe(result => {
      expect(result.status).toBe('CANCELLED');
      done();
    });

    const request = httpMock.expectOne(`${apiUrl}/1/cancel`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush(cancelledAppointment);
  });
});
