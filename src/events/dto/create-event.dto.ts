import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsMongoId,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PricingType } from '../entities/event.entity';

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class PricingDto {
  @IsEnum(PricingType)
  type: PricingType;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsMongoId()
  categoryId: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  isFeatured?: boolean;
}
