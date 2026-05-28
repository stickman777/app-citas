import { CenterScheduleSlotDto } from './dto/center-schedule-slot.dto';

export const DEFAULT_CENTER_SCHEDULE: CenterScheduleSlotDto[] = [
  { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
  { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
  { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
  { dayOfWeek: 2, startTime: '16:00', endTime: '20:00' },
  { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
  { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
  { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
  { dayOfWeek: 4, startTime: '16:00', endTime: '20:00' },
  { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' },
];
