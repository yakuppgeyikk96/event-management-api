import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;

  @IsString({ message: 'Şifre string olmalıdır' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;
}
