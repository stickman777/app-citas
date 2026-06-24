## Verificación

### Backend

1. Arranca PostgreSQL.
2. Arranca el backend.
3. Abre `http://localhost:3000/api/docs`.
4. Comprueba que Swagger carga.

### Frontend

1. Arranca el frontend.
2. Abre `http://localhost:4200/login`.
3. Comprueba que aparece `Iniciar sesión`.

### Primer inicio de sesión

1. Si usas administrador inicial, entra con:
   - Email: valor de `ADMIN_EMAIL`.
   - Password: valor de `ADMIN_PASSWORD`.
2. Si usas datos demo, entra como gestor:
   - Email: `marta.delgado@nortesalud.local`.
   - Password: `gestor1234`.
3. Si usas datos demo, entra en el portal del cliente:
   - Email: `ana.martinez@example.com`.
   - Password: `cliente1234`.

### Comprobaciones rápidas

- El gestor llega a `http://localhost:4200/index`.
- El cliente llega a `http://localhost:4200/client`.
- El menú del gestor muestra `Citas`, `Servicios`, `Especialistas`, `Clientes`, `Centros` y `Usuarios`.
- El portal del cliente muestra `Citas` y `Reservar`.
