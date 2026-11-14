import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateCvDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  age: number;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'Le CIN doit contenir exactement 8 chiffres.' })
  cin: string;

  @IsString()
  @IsNotEmpty()
  job: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  skillIds?: number[];
}
