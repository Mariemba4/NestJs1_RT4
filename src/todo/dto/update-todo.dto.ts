import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/validation-messages.js';
import { StatusEnum } from '../enums/status.enum.js';

export class UpdateTodoDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.name.mustBeString })
  @MinLength(3, { message: VALIDATION_MESSAGES.name.minLength })
  @MaxLength(10, { message: VALIDATION_MESSAGES.name.maxLength })
  name?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.description.mustBeString })
  @MinLength(10, { message: VALIDATION_MESSAGES.description.minLength })
  description?: string;

  @IsOptional()
  @IsEnum(StatusEnum, { message: VALIDATION_MESSAGES.status.mustBeValid })
  status?: StatusEnum;
}
