import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, ExecutionStatus } from '../../engine/entities/task.entity';
import { UserProgram } from '../../engine/entities/user-program.entity';
import { CapabilityType } from '../../engine/entities/task-definition.entity';

@Processor('engine_queue')
export class TaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskProcessor.name);
  private readonly isVercel = !!process.env.VERCEL;

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(UserProgram)
    private programRepo: Repository<UserProgram>,
  ) {
    super();
  }

  async process(job: Job<{ taskId: string }>): Promise<any> {
    if (this.isVercel) {
      this.logger.warn(`Skipping engine job ${job.id} on Vercel serverless — needs dedicated worker`);
      return { success: false, reason: 'serverless_skip' };
    }
    const { taskId } = job.data;
    this.logger.log(`Processing task: ${taskId}`);

    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['node', 'node.taskDefinition', 'program'],
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // 1. Update status to RUNNING
    task.status = ExecutionStatus.RUNNING;
    task.startedAt = new Date();
    await this.taskRepo.save(task);

    try {
      let result: any;

      // 2. Route to specific handler based on capability
      switch (task.node.taskDefinition.capability) {
        case CapabilityType.TEXT:
          result = await this.handleTextTask(task);
          break;
        case CapabilityType.AUDIO:
          result = await this.handleAudioTask(task);
          break;
        default:
          result = { message: 'Task type not implemented yet' };
      }

      // 3. Complete Task
      task.status = ExecutionStatus.COMPLETED;
      task.outputData = result;
      task.completedAt = new Date();
      await this.taskRepo.save(task);

      // 4. Update Program Progress
      await this.updateProgramProgress(task.programId);

      return result;
    } catch (error) {
      this.logger.error(`Task ${taskId} failed: ${error.message}`);
      task.status = ExecutionStatus.FAILED;
      task.errorLog = error.message;
      await this.taskRepo.save(task);
      throw error;
    }
  }

  private async handleTextTask(task: Task): Promise<any> {
    // Placeholder for text/scripting logic
    // In a real scenario, this might call another service to refine a script
    this.logger.debug(`Handling TEXT task for ${task.id}`);
    return { ...task.inputData, status: 'text_processed' };
  }

  private async handleAudioTask(task: Task): Promise<any> {
    // Placeholder for audio/TTS logic
    this.logger.debug(`Handling AUDIO task for ${task.id}`);
    return { ...task.inputData, status: 'audio_generated', url: 'https://example.com/audio.mp3' };
  }

  private async updateProgramProgress(programId: string) {
    const [tasks, total] = await this.taskRepo.findAndCount({
      where: { programId },
    });
    
    const completed = tasks.filter(t => t.status === ExecutionStatus.COMPLETED).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    await this.programRepo.update(programId, { progress });
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} started`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }
}
