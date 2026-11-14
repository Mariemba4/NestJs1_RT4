import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;
}
