# Manual de instalación

## Requisitos

### Software base

- Usa Node.js compatible con Angular 20: `^20.19.0 || ^22.12.0 || >=24.0.0`.
- Usa npm compatible con Angular CLI 20: `^6.11.0 || ^7.5.6 || >=8.0.0`.
- Usa PostgreSQL.
- TODO: fijar versión mínima de PostgreSQL para desarrollo y producción.

### Versiones del repositorio

| Componente | Versión deducida |
| --- | --- |
| Angular | `20.3.12` |
| Angular CLI | `20.3.10` |
| NestJS core | `11.1.19` |
| TypeORM | `0.3.28` |
| Driver PostgreSQL `pg` | `8.20.0` |

### Estructura

- Backend: `backend/`.
- Frontend: `frontend/`.
- No hay `package.json` en la raíz.
- Instala dependencias por separado en cada carpeta.

### Plantilla Word

- Usa `manuales/referencia.docx`.
- Es copia de `Memoria TFG.docx`.
- Sustitúyela por otra copia de la memoria si cambian sus estilos.
