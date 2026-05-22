import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { RewardsModule } from './rewards/rewards.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EngineModule } from './modules/engine/engine.module';
import { WorkerModule } from './modules/worker/worker.module';
import { StartupService } from './common/startup.service';

@Module({
  imports: [
    SentryModule.forRoot(),
    ServeStaticModule.forRoot(
      {
        rootPath: join(process.cwd(), 'public'),
        serveRoot: '/public',
      },
      {
        rootPath: join(process.cwd(), 'public', 'admin'),
        serveRoot: '/admin',
        renderPath: '/admin',
      },
    ),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        const isLocal =
          configService.get('DATABASE_HOST') === '127.0.0.1' ||
          (url && url.includes('127.0.0.1'));

        const dbConfig: any = {
          type: 'postgres',
          ssl: isLocal ? false : { rejectUnauthorized: false },
          connectTimeoutMS: 5000, // Reduced for faster failover in serverless
          autoLoadEntities: true, // More efficient for NestJS
          synchronize: false, // Automatically sync tables in local dev
          logging: isLocal, // Only log SQL queries in local development
        };

        if (url) {
          dbConfig.url = url;
        } else {
          dbConfig.host = configService.get<string>('DATABASE_HOST');
          dbConfig.port = configService.get<number>('DATABASE_PORT');
          dbConfig.username = configService.get<string>('DATABASE_USER');
          dbConfig.password = configService.get<string>('DATABASE_PASSWORD');
          dbConfig.database = configService.get<string>('DATABASE_NAME');
        }

        return dbConfig;
      },
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
    AdminModule,
    MailModule,
    RewardsModule,
    EngineModule,
    WorkerModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: process.env.VERCEL
        ? true
        : join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      resolvers: { JSON: require('graphql-type-json') },
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    StartupService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
