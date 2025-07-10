import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserMapper } from '../common/utils/user-mapper.util';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      const errorMessage = this.i18n.t('auth.errors.invalidCredentials');
      throw new UnauthorizedException(errorMessage);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      const errorMessage = this.i18n.t('auth.errors.invalidCredentials');
      throw new UnauthorizedException(errorMessage);
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      const errorMessage = this.i18n.t('auth.errors.emailAlreadyExists');
      throw new ConflictException(errorMessage);
    }

    const user = await this.usersService.create(registerDto);
    return this.generateTokens(user);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      const errorMessage = this.i18n.t('auth.errors.userNotFound');
      throw new UnauthorizedException(errorMessage);
    }

    return UserMapper.toResponseDto(user) as unknown as UserResponseDto;
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshTokenDto.refreshToken,
        {
          secret: jwtSecret,
        },
      );

      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        const errorMessage = this.i18n.t('auth.errors.userNotFound');
        throw new UnauthorizedException(errorMessage);
      }

      return this.generateTokens(user);
    } catch {
      const errorMessage = this.i18n.t('auth.errors.invalidRefreshToken');
      throw new UnauthorizedException(errorMessage);
    }
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      const errorMessage = this.i18n.t('auth.errors.userNotFound');
      throw new BadRequestException(errorMessage);
    }
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        secret: jwtSecret,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        secret: jwtSecret,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthUserDto(user),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    return null;
  }
}
