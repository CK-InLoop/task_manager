import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private logger = new Logger('SeedService');

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const userCount = await this.userModel.countDocuments();

    if (userCount > 0) {
      this.logger.log('Users already seeded — skipping');
      return;
    }

    this.logger.log('Seeding users...');

    const salt = await bcrypt.genSalt(10);

    const users = [
      {
        username: 'admin',
        email: 'admin@taskmanager.com',
        password: await bcrypt.hash('Admin123!', salt),
        role: 'admin',
      },
      {
        username: 'member1',
        email: 'member1@taskmanager.com',
        password: await bcrypt.hash('Member123!', salt),
        role: 'member',
      },
      {
        username: 'member2',
        email: 'member2@taskmanager.com',
        password: await bcrypt.hash('Member123!', salt),
        role: 'member',
      },
    ];

    await this.userModel.insertMany(users);
    this.logger.log('✅ Seeded 3 users: 1 admin, 2 members');
    this.logger.log('   Admin: admin@taskmanager.com / Admin123!');
    this.logger.log('   Member1: member1@taskmanager.com / Member123!');
    this.logger.log('   Member2: member2@taskmanager.com / Member123!');
  }
}
