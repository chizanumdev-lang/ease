import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GoalsModule } from './goals/goals.module';
import { ProgramsModule } from './programs/programs.module';
import { TasksModule } from './tasks/tasks.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ProgressModule } from './progress/progress.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VideosModule } from './videos/videos.module';
import { CoachModule } from './coach/coach.module';
import { AiModule } from './ai/ai.module';
import { VideoModule } from './video/video.module';
import { AudioModule } from './audio/audio.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    SentryModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', // Optional: adds a prefix
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrlString = configService.get('KV_URL') || configService.get('REDIS_URL');
        let connection: any = {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        };

        if (redisUrlString) {
          try {
            const parsedUrl = new URL(redisUrlString);
            connection = {
              host: parsedUrl.hostname,
              port: parseInt(parsedUrl.port, 10) || 6379,
              password: parsedUrl.password || undefined,
              username: parsedUrl.username || undefined,
              tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
            };
          } catch (e) {
            console.error('Failed to parse Redis URL from KV_URL/REDIS_URL', e);
          }
        }

        return { connection };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        connectTimeoutMS: 10000, // 10 seconds (Neon pooler resilience)
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    GoalsModule,
    ProgramsModule,
    TasksModule,
    QuizzesModule,
    ProgressModule,
    AnalyticsModule,
    VideosModule,
    CoachModule,
    AiModule,
    VideoModule,
    AudioModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule { }
