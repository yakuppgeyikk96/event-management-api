import { Category } from '../../categories/entities/category.entity';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class CategoryMapper {
  static toResponseDto(category: Category): CategoryResponseDto {
    return {
      _id: category._id?.toString() ?? '',
      name: category.name,
      description: category.description,
      type: category.type,
      organizerId: category.organizerId?.toString(),
      isActive: category.isActive,
      createdAt: category.createdAt ?? new Date(),
      updatedAt: category.updatedAt ?? new Date(),
    };
  }

  static toResponseDtoList(categories: Category[]): CategoryResponseDto[] {
    return categories.map((category) => this.toResponseDto(category));
  }

  static toTranslatedResponseDto(
    category: Category,
    translatedName: string,
    originalName?: string,
  ): CategoryResponseDto {
    return {
      _id: category._id?.toString() ?? '',
      name: translatedName,
      originalName: originalName,
      description: category.description,
      type: category.type,
      organizerId: category.organizerId?.toString(),
      isActive: category.isActive,
      createdAt: category.createdAt ?? new Date(),
      updatedAt: category.updatedAt ?? new Date(),
    };
  }
}
