## Base de datos

### Crear la base

1. Arranca PostgreSQL.
2. Crea una base con el valor de `DB_DATABASE`.
3. Configura usuario y password según `DB_USERNAME` y `DB_PASSWORD`.
4. TODO: definir comando oficial de creación de base local.

### Extensión requerida

- El backend usa `btree_gist` para evitar solapes de citas.
- El servicio de citas ejecuta al arrancar:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

- Si el usuario de PostgreSQL no tiene permisos, ejecútalo con un usuario con privilegios.

### Esquema

- No hay migraciones en el repositorio.
- No hay `DataSource` ni `ormconfig` para CLI de TypeORM.
- En desarrollo, TypeORM sincroniza entidades si `TYPEORM_SYNCHRONIZE` no vale `false`.
- En producción, `NODE_ENV=production` desactiva la sincronización.

### Datos iniciales

1. Define `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
2. Arranca el backend.
3. El backend crea el administrador inicial si no existe ningún usuario `ADMIN`.
4. Para datos demo, usa:

```env
SEED_DEMO_DATA=true
SEED_RESET_DATA=true
```

5. No uses `SEED_RESET_DATA=true` contra una base con datos reales.
