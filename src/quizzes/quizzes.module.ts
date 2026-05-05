import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesService } from './quizzes.service';
import { QuizzesResolver } from './quizzes.resolver';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Quiz, QuizAttempt])],
    controllers: [],
    providers: [QuizzesService, QuizzesResolver],
    exports: [QuizzesService],
})
export class QuizzesModule { }
