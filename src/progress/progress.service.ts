import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { CheckIn } from './entities/check-in.entity';

import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(CheckIn)
    private checkInRepository: Repository<CheckIn>,
  ) {}

  async createCheckin(
    userId: string,
    date: Date = new Date(),
  ): Promise<CheckIn> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Check if check-in already exists for today
    const existing = await this.checkInRepository.findOne({
      where: {
        userId,
        date: Between(startOfDay, endOfDay),
      },
    });

    if (existing) return existing;

    // 2. Create the check-in
    const checkIn = this.checkInRepository.create({
      userId,
      date: startOfDay,
    });
    const savedCheckIn = await this.checkInRepository.save(checkIn);

    return savedCheckIn;
  }

  async createMoodCheckin(
    userId: string,
    createCheckinDto: CreateCheckinDto,
  ): Promise<Progress> {
    const progress = this.progressRepository.create({
      ...createCheckinDto,
      checkinDate: createCheckinDto.checkinDate
        ? new Date(createCheckinDto.checkinDate)
        : new Date(),
      userId,
    });

    // Ensure base check-in exists
    await this.createCheckin(userId, progress.checkinDate);

    return this.progressRepository.save(progress);
  }

  
  async findProgressSince(userId: string, date: Date): Promise<Progress[]> {
    return this.progressRepository.find({
      where: { userId, checkinDate: require('typeorm').MoreThan(date) },
    });
  }

  async findRecent(userId: string): Promise<Progress[]> {
    return this.progressRepository.find({
      where: { userId },
      order: { checkinDate: 'DESC' },
      take: 7,
    });
  }
}
