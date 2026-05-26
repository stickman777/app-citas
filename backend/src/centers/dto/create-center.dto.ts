import { IsString } from 'class-validator';

export class CreateCenterDto {
  @IsString()
  name: string;
}
