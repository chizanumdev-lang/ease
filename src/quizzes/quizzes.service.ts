import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
  ) {}

  async findById(id: string, userId: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async submitAttempt(
    quizId: string,
    userId: string,
    submitQuizDto: SubmitQuizDto,
  ): Promise<QuizAttempt> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Calculate score
    const { answers } = submitQuizDto;
    let correctCount = 0;

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70; // 70% passing threshold

    const attempt = this.quizAttemptRepository.create({
      quizId,
      userId,
      answers,
      score,
      passed,
    });

    return this.quizAttemptRepository.save(attempt);
  }

  
  async findAttemptsSince(userId: string, date: Date): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.find({
      where: { userId, createdAt: require('typeorm').MoreThan(date) },
    });
  }

  async findRecentAttempts(userId: string): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }
}
