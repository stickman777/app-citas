## Problemas comunes

### Lista

- `JWT_SECRET no definido`: añade `JWT_SECRET` a `backend/.env`.
- No conecta con la base: revisa `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`.
- Error con `btree_gist`: habilita la extensión con un usuario con privilegios.
- El frontend no llama a la API: revisa `frontend/src/environments/environment.ts`.
- No aparece el administrador inicial: revisa `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
