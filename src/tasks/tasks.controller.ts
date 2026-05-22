import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  Logger,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';

@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private tasksService: TasksService,
    private aiService: AiService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post('vocal/grade')
  @UseInterceptors(FileInterceptor('audio'))
  async gradeVocal(
    @UploadedFile() file: Express.Multer.File,
    @Body('targetScript') targetScript: string,
    @Body('locale') locale: string,
    @Body('focus') focus: string,
  ) {
    try {
      this.logger.log(`Received vocal grading request for locale: ${locale}, focus: ${focus}`);
      if (!file) {
        this.logger.error('No audio file provided in request');
        throw new Error('No audio file provided');
      }
      return await this.aiService.gradeVocalPerformance(
        file.buffer,
        targetScript,
        locale,
        file.mimetype,
        focus || 'pronunciation',
      );
    } catch (error) {
      this.logger.error(`Vocal grading failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(
    @Body('messages')
    messages: { role: 'user' | 'assistant'; content: string }[],
    @Body('context') context: string,
    @Body('persona') persona: string,
  ) {
    try {
      this.logger.log(`Received chat request for persona: ${persona}`);
      const prompt = `You are ${persona}. Current context: ${context}. Keep your responses concise and intellectually challenging. \n\nHistory:\n${messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\nASSISTANT:`;

      const response = await this.aiService.generate(prompt);
      return { content: response };
    } catch (error) {
      this.logger.error(`Chat failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerate(@Param('id') id: string) {
    this.logger.log(`Received task regeneration request for task: ${id}`);
    return this.tasksService.regenerateMedia(id);
  }
}
