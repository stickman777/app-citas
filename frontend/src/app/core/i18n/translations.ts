export type Language = 'es' | 'en';

export const DEFAULT_LANGUAGE: Language = 'es';
export const SUPPORTED_LANGUAGES: Language[] = ['es', 'en'];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  es: {
    'sidebar.dashboard': 'Dashboard',
    'sidebar.clients': 'Clientes',
    'sidebar.services': 'Servicios',
    'sidebar.availability': 'Disponibilidad',
    'sidebar.appointments': 'Citas',
    'sidebar.users': 'Usuarios',
  },
  en: {
    'sidebar.dashboard': 'Dashboard',
    'sidebar.clients': 'Clients',
    'sidebar.services': 'Services',
    'sidebar.availability': 'Availability',
    'sidebar.appointments': 'Appointments',
    'sidebar.users': 'Users',
  },
};
