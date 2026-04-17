import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DayPlan } from '../programs/entities/day-plan.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(DayPlan)
        private dayPlanRepository: Repository<DayPlan>,
        @InjectQueue('program-generation')
        private programQueue: Queue,
    ) { }

    async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const task = await this.taskRepository.findOne({ 
            where: { id },
            relations: ['dayPlan', 'dayPlan.program', 'dayPlan.program.goal']
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const wasCompleted = task.completed;

        if (updateTaskDto.completed !== undefined) {
            task.completed = updateTaskDto.completed;
            task.completedAt = updateTaskDto.completed ? new Date() : undefined;
        }

        if (updateTaskDto.content !== undefined) {
            task.content = updateTaskDto.content;
        }

        if (updateTaskDto.watchedSeconds !== undefined) {
            task.watchedSeconds = updateTaskDto.watchedSeconds;
        }

        if (updateTaskDto.totalDuration !== undefined) {
            task.totalDuration = updateTaskDto.totalDuration;
        }

        const savedTask = await this.taskRepository.save(task);

        // HYDRATION TRIGGER: If reflection task just completed, queue next day immediately
        if (!wasCompleted && task.completed && task.type === 'reflection' && task.dayPlan) {
            const nextDayNumber = task.dayPlan.dayNumber + 1;
            const program = task.dayPlan.program;
            
            if (program && nextDayNumber <= program.duration) {
                const nextDay = await this.dayPlanRepository.findOne({
                    where: { programId: program.id, dayNumber: nextDayNumber }
                });

                if (nextDay && nextDay.status === 'pending') {
                    await this.programQueue.add('hydrate-day', {
                        dayPlanId: nextDay.id,
                        goalText: program.goal?.description || program.title || 'Goal',
                        params: { ...program.metadata, duration: program.duration }
                    }, {
                        priority: 1, // HIGH priority
                        attempts: 10,
                        backoff: { type: 'exponential', delay: 5000 }
                    });
                }
            }
        }

        return savedTask;
    }

    async findRecent(userId: string): Promise<Task[]> {
        return this.taskRepository.find({
            where: {
                dayPlan: {
                    program: {
                        userId
                    }
                }
            },
            relations: ['dayPlan', 'dayPlan.program'],
            order: { completedAt: 'DESC' },
            take: 10
        });
    }
}
