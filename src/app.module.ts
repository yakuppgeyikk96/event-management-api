import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { EventsModule } from './events/events.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from './jwt/jwt.module';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'tr',
      loaderOptions: {
        path: join(process.cwd(), 'src/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || '', {
      retryWrites: true,
      w: 'majority',
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    EventsModule,
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly categoriesService: CategoriesService) {}

  async onModuleInit() {
    await this.categoriesService.createSystemCategories();
  }
}
