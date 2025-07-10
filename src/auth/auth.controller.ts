import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ApiResponse } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.authService.register(registerDto);
    const message = i18n.t('auth.messages.userRegistered');
    return ApiResponse.success(result, message);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    const message = i18n.t('auth.messages.loginSuccessful');
    return ApiResponse.success(result, message);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.authService.refreshToken(refreshTokenDto);
    const message = i18n.t('auth.messages.tokenRefreshed');
    return ApiResponse.success(result, message);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: AuthenticatedRequest,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<null>> {
    await this.authService.logout(req.user._id);
    const message = i18n.t('auth.messages.logoutSuccessful');
    return ApiResponse.success(null, message);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Request() req: AuthenticatedRequest,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    const profile = await this.authService.getProfile(req.user._id);
    const message = i18n.t('auth.messages.profileRetrieved');
    return ApiResponse.success(profile, message);
  }
}
