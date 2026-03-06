import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
    constructor(private quizzesService: QuizzesService) { }

    @Get(':id')
    async getQuiz(@Param('id') id: string, @GetUser() user: User) {
        return this.quizzesService.findById(id, user.id);
    }

    @Post(':id/attempts')
    async submitAttempt(
        @Param('id') id: string,
        @GetUser() user: User,
        @Body() submitQuizDto: SubmitQuizDto,
    ) {
        return this.quizzesService.submitAttempt(id, user.id, submitQuizDto);
    }
}
