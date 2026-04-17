import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { CheckIn } from './entities/check-in.entity';
import { RewardEvent } from '../rewards/entities/reward-event.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class ProgressService {
    constructor(
        @InjectRepository(Progress)
        private progressRepository: Repository<Progress>,
        @InjectRepository(CheckIn)
        private checkInRepository: Repository<CheckIn>,
        @InjectRepository(RewardEvent)
        private rewardEventRepository: Repository<RewardEvent>,
    ) { }

    async createCheckin(userId: string, date: Date = new Date()): Promise<CheckIn> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Check if check-in already exists for today
        const existing = await this.checkInRepository.findOne({
            where: {
                userId,
                date: Between(startOfDay, endOfDay)
            }
        });

        if (existing) return existing;

        // 2. Create the check-in
        const checkIn = this.checkInRepository.create({
            userId,
            date: startOfDay
        });
        const savedCheckIn = await this.checkInRepository.save(checkIn);

        // 3. Check for streak extension (yesterday)
        const yesterday = new Date(startOfDay);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const checkedInYesterday = await this.checkInRepository.findOne({
            where: {
                userId,
                date: Between(startOfYesterday, endOfYesterday)
            }
        });

        if (checkedInYesterday) {
            // Reward for streak extension
            await this.rewardEventRepository.save(
                this.rewardEventRepository.create({
                    userId,
                    eventType: 'STREAK_BONUS',
                    points: 25,
                    description: 'Extended your daily spirit streak!'
                })
            );
        }

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

        // Also ensure a base check-in exists for streak purposes
        await this.createCheckin(userId, progress.checkinDate);

        return this.progressRepository.save(progress);
    }

    async findRecent(userId: string): Promise<Progress[]> {
        return this.progressRepository.find({
            where: { userId },
            order: { checkinDate: 'DESC' },
            take: 7,
        });
    }
}
