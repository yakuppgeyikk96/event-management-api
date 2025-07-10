import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;

  @IsString({ message: 'Şifre string olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsString({ message: 'Ad string olmalıdır' })
  firstName: string;

  @IsString({ message: 'Soyad string olmalıdır' })
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Geçerli bir rol seçiniz' })
  role?: UserRole;
}
