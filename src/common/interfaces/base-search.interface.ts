import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export interface BaseSearchOptions {
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  lang?: string;
  page?: number;
  limit?: number;
}

export class BaseSearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsString()
  @IsOptional()
  lang?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}
