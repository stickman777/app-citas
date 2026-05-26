import { IsOptional, IsString } from 'class-validator';

export class UpdateCenterDto {
  @IsOptional()
  @IsString()
  name?: string;
}
