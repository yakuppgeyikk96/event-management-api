import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { ApiResponse } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CategoryMapper } from '../common/utils/category-mapper.util';
import { I18nService } from 'nestjs-i18n';
import { CategorySearchDto } from './dto/category-search.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly i18n: I18nService,
  ) {}

  @Get('search')
  async searchCategories(
    @Request() req: AuthenticatedRequest,
    @Query() searchDto: CategorySearchDto,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.searchCategories({
      ...searchDto,
      organizerId: req.user._id,
    });

    const message = this.i18n.t('categories.messages.searchCompleted');
    return ApiResponse.success(categories, message);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    const category = await this.categoriesService.create(
      createCategoryDto,
      req.user._id,
    );

    const message = this.i18n.t('categories.messages.created');
    return ApiResponse.success(CategoryMapper.toResponseDto(category), message);
  }

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('lang') lang?: string,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.findAllByOrganizer(
      req.user._id,
      lang,
    );

    const message = this.i18n.t('categories.messages.retrieved');
    return ApiResponse.success(categories, message);
  }

  @Get('system')
  async findAllSystem(
    @Query('lang') lang?: string,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.findAllSystem(lang);

    const message = this.i18n.t('categories.messages.systemRetrieved');
    return ApiResponse.success(categories, message);
  }

  @Get('available')
  async findAllAvailable(
    @Request() req: AuthenticatedRequest,
    @Query('lang') lang?: string,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories =
      await this.categoriesService.findAllAvailableForOrganizer(
        req.user._id,
        lang,
      );

    const message = this.i18n.t('categories.messages.availableRetrieved');
    return ApiResponse.success(categories, message);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    const category = await this.categoriesService.findOne(id, req.user._id);

    const categoryResponse = CategoryMapper.toResponseDto(category);

    const message = this.i18n.t('categories.messages.retrieved');
    return ApiResponse.success(categoryResponse, message);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
      req.user._id,
    );

    const message = this.i18n.t('categories.messages.updated');
    return ApiResponse.success(CategoryMapper.toResponseDto(category), message);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<null>> {
    await this.categoriesService.remove(id, req.user._id);

    const message = this.i18n.t('categories.messages.deleted');
    return ApiResponse.success(null, message);
  }
}
