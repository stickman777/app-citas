## Variables de entorno

### Archivo

1. Crea o revisa `backend/.env`.
2. No subas secretos al repositorio.
3. Usa marcadores en documentación y ejemplos.
4. TODO: crear `backend/.env.example`; no existe en el repositorio.

### Variables

| Nombre | Uso | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto del backend. | `3000` |
| `DB_HOST` | Host de PostgreSQL. | `<host_postgresql>` |
| `DB_PORT` | Puerto de PostgreSQL. | `5432` |
| `DB_USERNAME` | Usuario de PostgreSQL. | `<usuario_postgresql>` |
| `DB_PASSWORD` | Password de PostgreSQL. | `<password_postgresql>` |
| `DB_DATABASE` | Base de datos de la aplicación. | `<base_datos>` |
| `JWT_SECRET` | Firma de tokens JWT. | `<jwt_secret>` |
| `ADMIN_EMAIL` | Email del administrador inicial. | `<email_admin>` |
| `ADMIN_PASSWORD` | Password del administrador inicial. | `<password_admin>` |
| `ADMIN_ALIAS` | Alias del administrador inicial. | `<alias_admin>` |
| `APP_TIMEZONE` | Zona horaria del proceso. | `Europe/Madrid` |
| `TYPEORM_SYNCHRONIZE` | Sincronización de esquema en desarrollo. | `true` |
| `SEED_DEMO_DATA` | Carga datos iniciales de demo. | `false` |
| `SEED_RESET_DATA` | Reinicia datos funcionales de demo. | `false` |
| `NODE_ENV` | Desactiva `synchronize` si vale `production`. | `development` |

### Ejemplo sin secretos

```env
PORT=3000
DB_HOST=<host_postgresql>
DB_PORT=5432
DB_USERNAME=<usuario_postgresql>
DB_PASSWORD=<password_postgresql>
DB_DATABASE=<base_datos>
JWT_SECRET=<jwt_secret>
ADMIN_EMAIL=<email_admin>
ADMIN_PASSWORD=<password_admin>
ADMIN_ALIAS=<alias_admin>
APP_TIMEZONE=Europe/Madrid
TYPEORM_SYNCHRONIZE=true
SEED_DEMO_DATA=false
SEED_RESET_DATA=false
NODE_ENV=development
```

### Frontend

- La URL de API está en `frontend/src/environments/environment.ts`.
- Valor actual: `http://localhost:3000`.
