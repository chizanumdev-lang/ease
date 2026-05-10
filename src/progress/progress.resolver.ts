import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { Progress } from './entities/progress.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Progress)
export class ProgressResolver {
  constructor(private readonly progressService: ProgressService) {}

  @Mutation(() => Progress, { name: 'createCheckin' })
  @UseGuards(JwtAuthGuard)
  async createCheckin(
    @GetUser() user: User,
    @Args('createCheckinDto') createCheckinDto: CreateCheckinDto,
  ): Promise<Progress> {
    return this.progressService.createMoodCheckin(user.id, createCheckinDto) as any;
  }
}

