import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, NestJwtModule],
})
export class JwtModule {}
