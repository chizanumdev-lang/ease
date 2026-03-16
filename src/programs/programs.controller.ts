import { Controller, Get, Post, Delete, Body, Param, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { GenerateProgramDto } from './dto/generate-program.dto';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
    constructor(private programsService: ProgramsService) { }

    @Post('generate')
    async generate(
        @GetUser() user: User,
        @Body() generateProgramDto: GenerateProgramDto,
    ) {
        return this.programsService.generateProgram(user.id, generateProgramDto);
    }

    @Get('active')
    async getActive(@GetUser() user: User) {
        return this.programsService.findActive(user.id);
    }

    @Get(':id')
    async findOne(@GetUser() user: User, @Param('id') id: string) {
        return this.programsService.findById(id, user.id);
    }

    @Delete(':id')
    async remove(@GetUser() user: User, @Param('id') id: string) {
        return this.programsService.deleteProgram(id, user.id);
    }

    @Get(':id/today')
    async getTodaysPlan(@GetUser() user: User, @Param('id') id: string) {
        return this.programsService.getTodaysPlan(id, user.id);
    }

    @Post(':id/evaluate')
    async evaluatePerformance(@GetUser() user: User, @Param('id') id: string) {
        return this.programsService.evaluatePerformance(id);
    }

    @Get(':id/stream')
    @Sse()
    streamProgramStatus(@Param('id') programId: string): Observable<MessageEvent> {
        return new Observable(observer => {
            const interval = setInterval(async () => {
                try {
                    const { days, programStatus } = await this.programsService.getProgramStatus(programId);
                    observer.next({ data: JSON.stringify({ days, programStatus }) } as MessageEvent);

                    if (programStatus === 'ready' || programStatus === 'failed') {
                        clearInterval(interval);
                        observer.complete();
                    }
                } catch (err) {
                    observer.error(err);
                    clearInterval(interval);
                }
            }, 1500);

            return () => clearInterval(interval);
        });
    }
}
