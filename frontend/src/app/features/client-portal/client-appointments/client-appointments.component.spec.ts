import { of, throwError } from 'rxjs';

import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import {
  ClientPortalAppointment,
  ClientPortalAppointmentRequest,
  ClientPortalService,
} from '../../../core/client-portal/client-portal.service';
import { ClientPortalOfflineCacheService } from '../../../core/client-portal/client-portal-offline-cache.service';
import { ClientAppointmentsComponent } from './client-appointments.component';

describe('ClientAppointmentsComponent offline cache - HU-08', () => {
  let component: ClientAppointmentsComponent;
  let clientPortalService: jasmine.SpyObj<ClientPortalService>;
  let offlineCache: jasmine.SpyObj<ClientPortalOfflineCacheService>;
  let authService: Partial<AuthService>;

  const appointment: ClientPortalAppointment = {
    id: 1,
    startDateTime: '2030-06-17T09:00:00',
    duration: 30,
    status: 'SCHEDULED',
    outsideAvailability: false,
    center: {
      id: 1,
      name: 'Centro Norte',
    },
    service: {
      id: 20,
      name: 'Fisioterapia',
      durationMinutes: 30,
    },
    specialist: {
      id: 30,
      name: 'Dra. Lopez',
    },
  };
  const request: ClientPortalAppointmentRequest = {
    id: 2,
    requestedStartDateTime: '2030-06-17T10:00:00',
    outsideAvailability: false,
    notes: null,
    status: 'PENDING',
    resolutionNote: null,
    resolvedAt: null,
    createdAt: '2030-06-01T10:00:00',
    appointmentId: null,
    center: {
      id: 1,
      name: 'Centro Norte',
    },
    service: {
      id: 20,
      name: 'Fisioterapia',
      durationMinutes: 30,
    },
    specialist: {
      id: 30,
      name: 'Dra. Lopez',
    },
  };

  beforeEach(() => {
    clientPortalService = jasmine.createSpyObj<ClientPortalService>(
      'ClientPortalService',
      [
        'getAppointments',
        'getAppointmentRequests',
        'cancelAppointment',
        'cancelAppointmentRequest',
      ],
    );
    offlineCache = jasmine.createSpyObj<ClientPortalOfflineCacheService>(
      'ClientPortalOfflineCacheService',
      ['getAppointments', 'saveAppointments'],
    );
    authService = {
      currentUser: {
        id: 100,
      } as CurrentUser,
    };

    component = new ClientAppointmentsComponent(
      clientPortalService,
      offlineCache,
      authService as AuthService,
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('HU-08: guarda en cache las citas cargadas correctamente', () => {
    clientPortalService.getAppointments.and.returnValue(of([appointment]));
    clientPortalService.getAppointmentRequests.and.returnValue(of([request]));

    component.loadAppointments();

    expect(component.appointments).toEqual([appointment]);
    expect(component.requests).toEqual([request]);
    expect(component.isOfflineData).toBeFalse();
    expect(offlineCache.saveAppointments).toHaveBeenCalledWith(
      100,
      [appointment],
      [request],
    );
  });

  it('HU-08: restaura citas cacheadas cuando la peticion falla', () => {
    clientPortalService.getAppointments.and.returnValue(
      throwError(() => new Error('offline')),
    );
    clientPortalService.getAppointmentRequests.and.returnValue(of([]));
    offlineCache.getAppointments.and.returnValue({
      appointments: [appointment],
      requests: [request],
      savedAt: '2030-06-01T10:00:00.000Z',
    });

    component.loadAppointments();

    expect(offlineCache.getAppointments).toHaveBeenCalledWith(100);
    expect(component.appointments).toEqual([appointment]);
    expect(component.requests).toEqual([request]);
    expect(component.isOfflineData).toBeTrue();
    expect(component.errorMessage).toBe('');
  });

  it('HU-08: muestra error si falla la peticion y no hay cache', () => {
    clientPortalService.getAppointments.and.returnValue(
      throwError(() => new Error('offline')),
    );
    clientPortalService.getAppointmentRequests.and.returnValue(of([]));
    offlineCache.getAppointments.and.returnValue(null);

    component.loadAppointments();

    expect(component.isOfflineData).toBeFalse();
    expect(component.errorMessage).toBe('client.appointments.errors.load');
  });

  it('HU-08: recarga las citas al recibir el evento online', () => {
    spyOn(component, 'loadAppointments');

    component.ngOnInit();
    window.dispatchEvent(new Event('online'));

    expect(component.loadAppointments).toHaveBeenCalledTimes(2);
  });
});
