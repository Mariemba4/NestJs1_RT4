import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/validation-messages.js';
import { StatusEnum } from '../enums/status.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class GetTodosDto extends PaginationDto {
  @IsOptional()
  @IsString({
    message: VALIDATION_MESSAGES.search.mustBeString,
  })
  search?: string;

  @IsOptional()
  @IsEnum(StatusEnum, {
    message: VALIDATION_MESSAGES.status.mustBeValid,
  })
  status?: StatusEnum;
}