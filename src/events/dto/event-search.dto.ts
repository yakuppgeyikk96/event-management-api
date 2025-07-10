import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { EventStatus } from '../entities/event.entity';
import { BaseSearchDto } from '../../common/interfaces/base-search.interface';

export class EventSearchDto extends BaseSearchDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  maxPrice?: number;
}
