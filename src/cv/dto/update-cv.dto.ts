import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpdateCvDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() firstname?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  age?: number;

  @IsOptional() @IsString() @Matches(/^\d{8}$/, { message: 'Le CIN doit contenir exactement 8 chiffres.' })
  cin?: string;

  @IsOptional() @IsString() job?: string;
  @IsOptional() @IsString() path?: string;

  @IsOptional() @IsArray() @ArrayUnique() @Type(() => Number) @IsInt({ each: true })
  skillIds?: number[];
}
