import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { VALIDATION_MESSAGES } from '../validation-messages.js';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.pagination.pageMustBeInt })
  @Min(1, { message: VALIDATION_MESSAGES.pagination.pageMin })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.pagination.limitMustBeInt })
  @Min(1, { message: VALIDATION_MESSAGES.pagination.limitMin })
  @Max(100, { message: VALIDATION_MESSAGES.pagination.limitMax })
  limit: number = 10;
}