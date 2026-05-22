import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardEvent } from './entities/reward-event.entity';
import { User } from '../users/entities/user.entity';
import { ProgressionService } from '../programs/progression.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardEvent)
    private rewardEventRepository: Repository<RewardEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private progressionService: ProgressionService,
  ) {}

  async rewardTaskCompletion(userId: string, taskType: string): Promise<void> {
    let points = 10;
    let description = 'Completed a task';

    if (taskType === 'reflection') {
      points = 15;
      description = 'Completed a mindfulness reflection';
    } else if (taskType === 'video') {
      points = 12;
      description = 'Completed a video lesson';
    }

    await this.addXP(userId, points, description, 'TASK_COMPLETION', {
      taskType,
    });
  }

  async addXP(
    userId: string,
    points: number,
    description: string,
    eventType: string,
    metadata: any = {},
  ): Promise<void> {
    // 1. Create reward event record
    const event = this.rewardEventRepository.create({
      userId,
      points,
      description,
      eventType,
      metadata,
    });
    await this.rewardEventRepository.save(event);

    // 2. Update user XP and level
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      const oldLevel = user.level;
      user.xp += points;

      // Use ProgressionService for consistent level logic
      const newLevel = this.progressionService.getLevelForXp(user.xp);

      if (newLevel > oldLevel) {
        user.level = newLevel;
        // Add a level up event too
        await this.rewardEventRepository.save(
          this.rewardEventRepository.create({
            userId,
            points: 50, // Bonus for leveling up
            description: `Reached Level ${newLevel}!`,
            eventType: 'LEVEL_UP',
          }),
        );
      }

      await this.userRepository.save(user);
    }
  }
}
