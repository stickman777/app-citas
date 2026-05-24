# Operaciones API - Backend TFG App de Citas

## Auth

### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "admin@test.com",
  "password": "1234"
}
```

---

## Users

### Crear usuario

```http
POST /users
```

Body:

```json
{
  "email": "cliente@test.com",
  "password": "1234",
  "role": "CLIENT"
}
```

### Listar usuarios

```http
GET /users
```

---

## Clients

### Crear cliente

```http
POST /clients
```

Body:

```json
{
  "name": "Juan Pérez",
  "phone": "600000000",
  "email": "juan@test.com",
  "notes": "Cliente VIP",
  "priority": 1
}
```

### Listar clientes

```http
GET /clients
```

---

## Services

### Crear servicio

```http
POST /services
```

Body:

```json
{
  "name": "Corte de pelo",
  "duration": 45,
  "price": 18.5
}
```

### Listar servicios

```http
GET /services
```

---

## Appointments

### Crear cita

```http
POST /appointments
```

Body:

```json
{
  "startDateTime": "2026-06-01T10:00:00",
  "clientId": 1,
  "serviceId": 1
}
```

### Listar todas las citas

```http
GET /appointments
```

### Filtrar citas por fecha

```http
GET /appointments?date=2026-06-01
```

### Obtener huecos disponibles

```http
GET /appointments/available-slots?date=2026-06-01&serviceId=1
```

### Cancelar cita

```http
PATCH /appointments/1/cancel
```

### Completar cita

```http
PATCH /appointments/1/complete
```

---

## Availability

### Crear disponibilidad

```http
POST /availability
```

Body:

```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "14:00"
}
```

### Listar toda la disponibilidad

```http
GET /availability
```

### Obtener disponibilidad de un día

```http
GET /availability/day/1
```

### Editar disponibilidad

```http
PATCH /availability/1
```

Body:

```json
{
  "startTime": "10:00",
  "endTime": "14:00"
}
```

### Eliminar disponibilidad

```http
DELETE /availability/1
```

---

## Notas

- Todas las rutas excepto `POST /auth/login` requieren Bearer Token JWT.
- En Postman: Authorization → Bearer Token → pegar `access_token`.
- `dayOfWeek`:
  - 0 = domingo
  - 1 = lunes
  - 2 = martes
  - 3 = miércoles
  - 4 = jueves
  - 5 = viernes
  - 6 = sábado

