import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { SeedModule } from './seed/seed.module';
import { EventsModule } from './gateway/events.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection via Mongoose
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager'),

    // Feature modules
    AuthModule,
    UsersModule,
    TasksModule,
    SeedModule,
    EventsModule,
  ],
})
export class AppModule {}
