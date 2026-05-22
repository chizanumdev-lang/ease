import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Goal } from '../goals/entities/goal.entity';
import { AdaptationLog } from './entities/adaptation-log.entity';
import { Progress } from '../progress/entities/progress.entity';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { YoutubeService } from '../video/youtube/youtube.service';
import { AudioService } from '../audio/audio.service';
import { AudioMixerService } from '../audio/audio-mixer.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let programRepository: any;

  const mockRepository = () => ({
    findOne: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  });

  const mockQueue = () => ({
    add: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: getRepositoryToken(Program), useFactory: mockRepository },
        { provide: getRepositoryToken(DayPlan), useFactory: mockRepository },
        { provide: getRepositoryToken(Task), useFactory: mockRepository },
        { provide: getRepositoryToken(AudioTrack), useFactory: mockRepository },
        { provide: getRepositoryToken(Quiz), useFactory: mockRepository },
        {
          provide: getRepositoryToken(QuizAttempt),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(Goal), useFactory: mockRepository },
        {
          provide: getRepositoryToken(AdaptationLog),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(Progress), useFactory: mockRepository },
        { provide: getQueueToken('audio-generation'), useFactory: mockQueue },
        { provide: getQueueToken('program-generation'), useFactory: mockQueue },
        { provide: UsersService, useValue: {} },
        { provide: AiService, useValue: {} },
        { provide: YoutubeService, useValue: {} },
        { provide: AudioService, useValue: {} },
        { provide: AudioMixerService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    programRepository = module.get(getRepositoryToken(Program));
  });

  describe('deleteProgram', () => {
    it('should successfully delete a program if it exists and belongs to the user', async () => {
      const userId = 'user-123';
      const programId = 'program-456';
      const mockProgram = { id: programId, userId };

      programRepository.findOne.mockResolvedValue(mockProgram);
      programRepository.remove.mockResolvedValue(mockProgram);

      await service.deleteProgram(programId, userId);

      expect(programRepository.findOne).toHaveBeenCalledWith({
        where: { id: programId, userId },
      });
      expect(programRepository.remove).toHaveBeenCalledWith(mockProgram);
    });

    it('should throw NotFoundException if the program does not exist', async () => {
      const userId = 'user-123';
      const programId = 'non-existent';

      programRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProgram(programId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(programRepository.remove).not.toHaveBeenCalled();
    });
  });
});
