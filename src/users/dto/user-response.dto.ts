import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  _id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: string;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  emailVerificationToken: string;

  @Exclude()
  passwordResetToken: string;

  @Exclude()
  passwordResetExpires: Date;
}
