import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Quiz)
export class QuizzesResolver {
  private readonly logger = new Logger(QuizzesResolver.name);

  constructor(private readonly quizzesService: QuizzesService) {}

  @Query(() => Quiz, { name: 'getQuiz' })
  @UseGuards(JwtAuthGuard)
  async getQuiz(@Args('id') id: string, @GetUser() user: User): Promise<Quiz> {
    this.logger.log(`Fetching quiz ${id} for user ${user.id}`);
    return this.quizzesService.findById(id, user.id);
  }

  @Mutation(() => QuizAttempt, { name: 'submitQuizAttempt' })
  @UseGuards(JwtAuthGuard)
  async submitQuizAttempt(
    @Args('id') id: string,
    @Args('submitQuizDto') submitQuizDto: SubmitQuizDto,
    @GetUser() user: User,
  ): Promise<QuizAttempt> {
    this.logger.log(
      `Submitting quiz attempt for quiz ${id} by user ${user.id}`,
    );
    try {
      const attempt = await this.quizzesService.submitAttempt(
        id,
        user.id,
        submitQuizDto,
      );
      this.logger.log(
        `Quiz attempt submitted successfully: ${attempt.id}. Score: ${attempt.score}`,
      );
      return attempt;
    } catch (error) {
      this.logger.error(
        `Failed to submit quiz attempt for quiz ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
