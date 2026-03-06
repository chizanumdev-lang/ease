import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
    constructor(private goalsService: GoalsService) { }

    @Post()
    async create(@GetUser() user: User, @Body() createGoalDto: CreateGoalDto) {
        return this.goalsService.create(user.id, createGoalDto);
    }

    @Get()
    async findAll(@GetUser() user: User) {
        return this.goalsService.findAllByUser(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: User, @Param('id') id: string) {
        return this.goalsService.delete(user.id, id);
    }
}
