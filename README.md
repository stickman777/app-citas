# App Citas

Aplicacion web para la gestion de citas en centros sanitarios o clinicas. El proyecto esta dividido en un backend REST con NestJS y un frontend con Angular.

El objetivo de la aplicacion es permitir que administradores y gestores organicen centros, usuarios, clientes, especialistas, servicios, horarios y citas, mientras que los clientes pueden acceder a su propio portal para consultar y reservar citas.

## Tecnologias

- Backend: NestJS, TypeScript, TypeORM, PostgreSQL, JWT, Swagger/OpenAPI.
- Frontend: Angular, TypeScript, Bootstrap, PrimeNG, angular-calendar.
- Testing: Jest, Supertest, Karma/Jasmine.

## Funcionalidades principales

- Autenticacion con JWT.
- Roles de usuario: `ADMIN`, `GESTOR` y `CLIENT`.
- Gestion de centros y seleccion de centro activo.
- Gestion de usuarios, clientes, servicios y especialistas.
- Agenda de citas con creacion, reprogramacion, cancelacion y finalizacion.
- Control de disponibilidad, excepciones horarias y ausencias de especialistas.
- Validacion de solapes de citas a nivel de aplicacion y base de datos.
- Portal de cliente para consultar perfil, ver citas y reservar.
- Registro de clientes mediante invitacion.
- Documentacion de API con Swagger.

## Estructura del proyecto

```text
app-citas/
  backend/              API REST NestJS
    src/
      auth/             login, JWT, roles y perfil
      users/            usuarios y roles
      centers/          centros y acceso por centro
      clients/          fichas de clientes e invitaciones
      specialists/      especialistas y ausencias
      services/         servicios ofertados
      availability/     horarios y excepciones
      appointments/     citas y disponibilidad de huecos
      client-portal/    endpoints del area cliente
      appointment-requests/
  frontend/             Aplicacion Angular
    src/app/
      auth/             login y registro por invitacion
      core/             servicios, guards e interceptores
      features/         pantallas principales de gestion
      shared/           rutas, layout y utilidades compartidas
```

## Requisitos

- Node.js compatible con Angular 20 y NestJS 11.
- npm.
- PostgreSQL.

No hay un `package.json` raiz. Las dependencias se instalan por separado en `backend` y `frontend`.

## Configuracion del backend

Crea o revisa el archivo `backend/.env` con una configuracion similar:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=app_citas

JWT_SECRET=cambia_este_valor_en_local

ADMIN_EMAIL=admin@app-citas.local
ADMIN_PASSWORD=admin1234
ADMIN_ALIAS=admin

APP_TIMEZONE=Europe/Madrid
TYPEORM_SYNCHRONIZE=true

SEED_DEMO_DATA=false
SEED_RESET_DATA=false
```

Notas:

- `TYPEORM_SYNCHRONIZE` esta pensado para desarrollo. En produccion debe estar desactivado.
- Si faltan `ADMIN_EMAIL` o `ADMIN_PASSWORD`, el backend no crea el administrador inicial.
- `SEED_DEMO_DATA=true` crea datos de ejemplo al arrancar.
- `SEED_RESET_DATA=true` reinicia datos funcionales de demo; no debe usarse contra una base con datos importantes.

## Instalacion

Desde la raiz del repositorio:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Ejecucion en local

Levanta primero PostgreSQL y asegurate de que existe la base indicada en `DB_DATABASE`.

Terminal 1, backend:

```bash
cd backend
npm run start:dev
```

La API queda disponible en:

- `http://localhost:3000`
- `http://localhost:3000/api/docs` para Swagger

Terminal 2, frontend:

```bash
cd frontend
npm run start
```

La aplicacion queda disponible en:

- `http://localhost:4200`

El frontend usa por defecto `http://localhost:3000` como URL de API, definido en `frontend/src/environments/environment.ts`.

## Datos de demo

Para cargar datos de ejemplo en desarrollo:

```env
SEED_DEMO_DATA=true
SEED_RESET_DATA=true
```

Despues arranca el backend. El seed incluye centros, gestores, especialistas, servicios, clientes y citas.

Usuarios utiles si se cargan los datos de demo:

```text
Gestor:
email: marta.delgado@nortesalud.local
password: gestor1234

Cliente:
email: ana.martinez@example.com
password: cliente1234
```

El usuario administrador depende de `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Scripts utiles

Backend:

```bash
cd backend
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run start
npm run build
npm run test
npm run lint
```

## Pruebas e2e del backend

Las pruebas e2e usan una base PostgreSQL real y recrean el esquema de la base de pruebas. No deben apuntar a la base de desarrollo.

Ejemplo con Docker:

```bash
docker run --name app-citas-test-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app_citas_test \
  -p 5433:5432 \
  -d postgres:16
```

Variables para ejecutar las pruebas contra esa base:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5433"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:TEST_DB_DATABASE="app_citas_test"
```

Ejecucion:

```bash
cd backend
npm run test:e2e -- --runInBand
```

## API

La documentacion OpenAPI se genera al arrancar el backend y esta disponible en:

```text
http://localhost:3000/api/docs
```

Los endpoints protegidos esperan el token JWT en la cabecera:

```text
Authorization: Bearer <token>
```

## Consideraciones

- El proyecto usa `synchronize` de TypeORM en desarrollo, por lo que el esquema se ajusta desde las entidades.
- La aplicacion depende de PostgreSQL para restricciones de solape de citas mediante `btree_gist`.
- El frontend y el backend se ejecutan como aplicaciones separadas durante el desarrollo.
