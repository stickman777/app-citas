import { IsInt, Min } from 'class-validator';

export class UpdateActiveCenterDto {
  @IsInt()
  @Min(1)
  centerId: number;
}
