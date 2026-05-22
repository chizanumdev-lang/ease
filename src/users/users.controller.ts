import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@GetUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      settings: user.settings,
      createdAt: user.createdAt,
    };
  }

  @Patch('me/settings')
  async updateSettings(
    @GetUser() user: User,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const updatedUser = await this.usersService.updateSettings(
      user.id,
      updateSettingsDto,
    );
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      isVerified: updatedUser.isVerified,
      settings: updatedUser.settings,
    };
  }
}
