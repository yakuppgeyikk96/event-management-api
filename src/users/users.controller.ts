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
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiResponse } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { UserMapper } from '../common/utils/user-mapper.util';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);
    const message = i18n.t('users.messages.userCreated');

    const userResponse = UserMapper.toResponseDto(
      user,
    ) as unknown as UserResponseDto;

    return ApiResponse.success(userResponse, message);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<UserResponseDto[]>> {
    const users = await this.usersService.findAll();
    const message = i18n.t('users.messages.usersRetrieved');
    const userResponses = UserMapper.toResponseDtoList(
      users,
    ) as unknown as UserResponseDto[];
    return ApiResponse.success(userResponses, message);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      const errorMessage = i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    const message = i18n.t('users.messages.userRetrieved');
    const userResponse = UserMapper.toResponseDto(
      user,
    ) as unknown as UserResponseDto;
    return ApiResponse.success(userResponse, message);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);

    if (!user) {
      const errorMessage = i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    const message = i18n.t('users.messages.userUpdated');
    const userResponse = UserMapper.toResponseDto(
      user,
    ) as unknown as UserResponseDto;
    return ApiResponse.success(userResponse, message);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<null>> {
    const user = await this.usersService.remove(id);

    if (!user) {
      const errorMessage = i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    const message = i18n.t('users.messages.userDeleted');
    return ApiResponse.success(null, message);
  }
}
