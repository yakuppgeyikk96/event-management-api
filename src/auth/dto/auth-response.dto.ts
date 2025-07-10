export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
}
