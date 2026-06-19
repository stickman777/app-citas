# Pruebas de integracion backend

Estas pruebas usan Jest + Supertest contra una base de datos PostgreSQL real y separada de desarrollo.

## Levantar la base de datos de pruebas

Opcion con Docker:

```bash
docker run --name app-citas-test-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=app_citas_test ^
  -p 5433:5432 ^
  -d postgres:16
```

En PowerShell, configura las variables para apuntar a esa base:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5433"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:TEST_DB_DATABASE="app_citas_test"
```

Si ya tienes PostgreSQL local en `localhost:5432`, puedes crear la base manualmente:

```sql
CREATE DATABASE app_citas_test;
```

Y ejecutar con las variables por defecto del proyecto:

```powershell
$env:TEST_DB_DATABASE="app_citas_test"
```

## Ejecutar

Desde `backend`:

```bash
npm run test:e2e -- --runInBand
```

Las pruebas recrean el esquema al arrancar (`dropSchema: true`) dentro de `TEST_DB_DATABASE` o, si no existe, `app_citas_test`. No apuntes estas pruebas a la base de desarrollo porque se borrara el esquema.

## Que verifican

- Login correcto, login incorrecto, ruta privada sin token y rol no autorizado.
- CRUD de usuarios por administrador.
- Ciclo de vida de citas por HTTP.
- Creacion de la extension `btree_gist` y restricciones de exclusion contra solapes.
- Rechazo 409 por solape concurrente controlado por PostgreSQL.
- Validacion de contrato con 400.
- Aislamiento de centros para gestores.
- Reserva de cliente dentro y fuera de su centro.
