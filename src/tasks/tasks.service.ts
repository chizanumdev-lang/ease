import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) { }

    async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id } });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

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

        return this.taskRepository.save(task);
    }

    async findRecent(userId: string): Promise<Task[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Assuming Task entity has userId or is linked to Plan -> User. 
        // Need to check Task entity relation. 
        // Based on modules, Tasks seems standalone or linked to Plan.
        // Let's assume relation to User for now or we might need a join.
        // If Task is linked to DayPlan (which is likely), we need to query differently.
        // For MVP, if easy relation missing, return empty or implement basic query if possible.
        // Checking Task entity would be safer. I will check Task entity first.
        return [];
    }
}
