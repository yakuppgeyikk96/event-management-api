import { IsString, IsOptional } from 'class-validator';
import { BaseSearchDto } from '../../common/interfaces/base-search.interface';

export class CategorySearchDto extends BaseSearchDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  organizerId: string;
}
