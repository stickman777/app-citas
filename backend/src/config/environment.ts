const LOCAL_FRONTEND_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];

const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
] as const;

export const isProduction = process.env.NODE_ENV === 'production';

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }

  return value;
}

export function getEnvFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`La variable ${name} debe ser true o false`);
}

export function getDatabasePort(): number {
  const port = Number(getRequiredEnv('DB_PORT'));

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto TCP valido');
  }

  return port;
}

export function getCorsOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? origins : LOCAL_FRONTEND_ORIGINS;
}

export function isSwaggerEnabled(): boolean {
  return getEnvFlag('SWAGGER_ENABLED', !isProduction);
}

export function validateEnvironment(): void {
  REQUIRED_ENV_VARS.forEach(getRequiredEnv);
  getDatabasePort();

  if (isProduction && getRequiredEnv('JWT_SECRET').length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en produccion');
  }

  if (isProduction && getEnvFlag('TYPEORM_SYNCHRONIZE')) {
    throw new Error('TYPEORM_SYNCHRONIZE no puede estar activo en produccion');
  }

  if (isProduction && getEnvFlag('SEED_RESET_DATA')) {
    throw new Error('SEED_RESET_DATA no puede estar activo en produccion');
  }
}
