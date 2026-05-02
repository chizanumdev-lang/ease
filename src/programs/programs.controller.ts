import { Controller, Get, Post, Body, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { GenerateProgramDto } from './dto/generate-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
    private readonly logger = new Logger(ProgramsController.name);

    constructor(private readonly programsService: ProgramsService) { }

    @Get('active')
    async getActiveProgram(@GetUser() user: User) {
        return this.programsService.findActive(user.id);
    }

    @Post('preview')
    async getProgramPreview(
        @Body() generateProgramDto: GenerateProgramDto,
        @GetUser() user: User,
    ) {
        return this.programsService.getProgramPreview(user.id, generateProgramDto);
    }

    @Post('generate')
    async generateProgram(
        @Body() generateProgramDto: GenerateProgramDto,
        @GetUser() user: User,
    ) {
        return this.programsService.generateProgram(user.id, generateProgramDto);
    }

    @Get(':id')
    async getProgramById(@Param('id') id: string, @GetUser() user: User) {
        return this.programsService.findById(id, user.id);
    }

    @Get(':id/today')
    async getTodaysPlan(@Param('id') id: string, @GetUser() user: User) {
        return this.programsService.getTodaysPlan(id, user.id);
    }

    @Delete(':id')
    async deleteProgram(@Param('id') id: string, @GetUser() user: User) {
        await this.programsService.deleteProgram(id, user.id);
        return { success: true };
    }
}
