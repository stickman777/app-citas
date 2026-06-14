import { config as loadEnv } from 'dotenv';

// IMPORTANTE: este módulo debe importarse el PRIMERO de todos (antes que
// cualquier otro import de la aplicación). Fija la zona horaria del proceso de
// forma determinista, antes de que se cree la primera fecha. Node solo aplica
// process.env.TZ si se establece antes de usar cualquier Date.
//
// Sin esto, el backend usaría la zona horaria del host (p. ej. UTC en AWS) y
// todo el cálculo de fechas (huecos disponibles, disponibilidad semanal,
// solapes de citas) sufriría desfases de horas, ya que la lógica trabaja con la
// hora local del servidor (getDay, toTimeString, new Date(fechaLocal)).
//
// Se carga el .env aquí porque este módulo se ejecuta antes que ConfigModule;
// dotenv no sobreescribe variables ya presentes en el entorno, así que un
// APP_TIMEZONE/TZ definido en el sistema mantiene la prioridad.
loadEnv();

// Zona horaria configurable con APP_TIMEZONE (o TZ); Europe/Madrid por defecto.
process.env.TZ =
  process.env.APP_TIMEZONE?.trim() || process.env.TZ?.trim() || 'Europe/Madrid';
