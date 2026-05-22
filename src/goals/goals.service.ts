import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async create(userId: string, createGoalDto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepository.create({
      ...createGoalDto,
      userId,
    });
    return this.goalRepository.save(goal);
  }

  async findActive(userId: string): Promise<Goal | null> {
    return this.goalRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUser(userId: string): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async delete(userId: string, goalId: string): Promise<void> {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this goal',
      );
    }
    await this.goalRepository.remove(goal);
  }
}
