import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class UserMapper {
  static toResponseDto(
    user: User,
  ): Omit<
    UserResponseDto,
    | 'password'
    | 'emailVerificationToken'
    | 'passwordResetToken'
    | 'passwordResetExpires'
  > {
    return {
      _id: user._id?.toString() ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
    };
  }

  static toResponseDtoList(
    users: User[],
  ): Omit<
    UserResponseDto,
    | 'password'
    | 'emailVerificationToken'
    | 'passwordResetToken'
    | 'passwordResetExpires'
  >[] {
    return users.map((user) => this.toResponseDto(user));
  }

  static toAuthUserDto(user: User): {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  } {
    return {
      _id: user._id?.toString() ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
