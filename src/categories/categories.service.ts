import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
  CategoryFindByOrganizerQuery,
  CategoryFindOneQuery,
  CategoryFindSystemQuery,
  CategoryType,
} from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategorySearchDto } from './dto/category-search.dto';
import { I18nService } from 'nestjs-i18n';
import { CategoryMapper } from 'src/common/utils/category-mapper.util';
import {
  SearchFilterUtil,
  SearchFilterConfig,
} from '../common/utils/search-filter.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private i18n: I18nService,
  ) {}

  async createSystemCategories(): Promise<void> {
    const systemCategories = [
      { key: 'concert', name: 'concert' },
      { key: 'theater', name: 'theater' },
      { key: 'sport', name: 'sport' },
      { key: 'conference', name: 'conference' },
      { key: 'festival', name: 'festival' },
      { key: 'workshop', name: 'workshop' },
      { key: 'exhibition', name: 'exhibition' },
      { key: 'seminar', name: 'seminar' },
    ];

    for (const category of systemCategories) {
      const existing = await this.categoryModel.findOne({
        name: category.key,
        type: CategoryType.SYSTEM,
      });

      if (!existing) {
        await this.categoryModel.create({
          name: category.key,
          type: CategoryType.SYSTEM,
        });
      }
    }
  }

  async searchCategories(
    searchDto: CategorySearchDto,
  ): Promise<CategoryResponseDto[]> {
    const query: Record<string, any> = {
      $or: [
        {
          type: CategoryType.SYSTEM,
          isActive: true,
        },
        {
          organizerId: new Types.ObjectId(searchDto.organizerId),
          isActive: true,
        },
      ],
    };

    const searchConfig: SearchFilterConfig = {
      textFields: ['name'],
      exactFields: ['type'],
      objectIdFields: ['organizerId'],
      defaultSort: { field: 'name', order: 1 },
    };

    SearchFilterUtil.addSearchFilters(query, searchDto, searchConfig);

    const sort = SearchFilterUtil.buildSortQuery(searchDto, searchConfig);

    const { limit, skip } = SearchFilterUtil.buildPaginationQuery(searchDto);

    const categories = await this.categoryModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return this.translateCategories(categories, searchDto.lang || 'tr');
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    organizerId: string,
  ): Promise<Category> {
    const existingCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      organizerId: new Types.ObjectId(organizerId),
    });

    if (existingCategory) {
      const errorMessage = this.i18n.t(
        'categories.errors.categoryAlreadyExists',
      );
      throw new ConflictException(errorMessage);
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      organizerId: new Types.ObjectId(organizerId),
      type: CategoryType.CUSTOM,
    });

    return category.save();
  }

  async findAllByOrganizer(
    organizerId: string,
    lang: string = 'tr',
  ): Promise<CategoryResponseDto[]> {
    const query: CategoryFindByOrganizerQuery = {
      organizerId: new Types.ObjectId(organizerId),
      isActive: true,
    };

    const categories = await this.categoryModel
      .find(query)
      .sort({ name: 1 })
      .exec();

    return this.translateCategories(categories, lang);
  }

  async findAllSystem(lang: string = 'tr'): Promise<CategoryResponseDto[]> {
    const query: CategoryFindSystemQuery = {
      type: CategoryType.SYSTEM,
      isActive: true,
    };

    const categories = await this.categoryModel
      .find(query)
      .sort({ name: 1 })
      .exec();

    return this.translateCategories(categories, lang);
  }

  async findAllAvailableForOrganizer(
    organizerId: string,
    lang: string = 'tr',
  ): Promise<CategoryResponseDto[]> {
    const [systemCategories, customCategories] = await Promise.all([
      this.findAllSystem(lang),
      this.findAllByOrganizer(organizerId, lang),
    ]);

    return [...systemCategories, ...customCategories];
  }

  async findOne(id: string, organizerId?: string): Promise<Category> {
    const query: CategoryFindOneQuery = {
      _id: new Types.ObjectId(id),
      isActive: true,
    };

    const category = await this.categoryModel.findOne(query);

    if (!category) {
      const errorMessage = this.i18n.t('categories.errors.categoryNotFound');
      throw new NotFoundException(errorMessage);
    }

    if (organizerId && category.type === CategoryType.CUSTOM) {
      if (
        !category.organizerId ||
        category.organizerId.toString() !== organizerId
      ) {
        const errorMessage = this.i18n.t('categories.errors.categoryNotFound');
        throw new NotFoundException(errorMessage);
      }
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    organizerId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, organizerId);

    if (category.type === CategoryType.SYSTEM) {
      const errorMessage = this.i18n.t(
        'categories.errors.systemCategoryCannotBeModified',
      );
      throw new BadRequestException(errorMessage);
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        organizerId: new Types.ObjectId(organizerId),
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existingCategory) {
        const errorMessage = this.i18n.t(
          'categories.errors.categoryAlreadyExists',
        );
        throw new ConflictException(errorMessage);
      }
    }

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true },
    );

    if (!updatedCategory) {
      const errorMessage = this.i18n.t('categories.errors.categoryNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedCategory;
  }

  async remove(id: string, organizerId: string): Promise<Category> {
    const category = await this.findOne(id, organizerId);

    if (category.type === CategoryType.SYSTEM) {
      const errorMessage = this.i18n.t(
        'categories.errors.systemCategoryCannotBeModified',
      );
      throw new BadRequestException(errorMessage);
    }

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!updatedCategory) {
      const errorMessage = this.i18n.t('categories.errors.categoryNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedCategory;
  }

  private async translateCategories(
    categories: Category[],
    lang: string,
  ): Promise<CategoryResponseDto[]> {
    return Promise.all(
      categories.map((category) => {
        if (category.type === CategoryType.SYSTEM) {
          const translatedName = this.i18n.t(
            `categories.system.${category.name}`,
            { lang },
          );
          return CategoryMapper.toTranslatedResponseDto(
            category,
            translatedName,
            category.name,
          );
        } else {
          return CategoryMapper.toResponseDto(category);
        }
      }),
    );
  }
}
