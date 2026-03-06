import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachMessageDto } from './dto/coach-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path
import { GetUser } from '../common/decorators/get-user.decorator'; // Adjust path
import { User } from '../users/entities/user.entity'; // Adjust path

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachController {
    constructor(private readonly coachService: CoachService) { }

    @Post('message')
    async generateMessage(@GetUser() user: User, @Body() coachMessageDto: CoachMessageDto) {
        return this.coachService.generateCoachMessage(user.id, coachMessageDto.message);
    }
}
