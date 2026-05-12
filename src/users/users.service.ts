import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async updateSettings(
        userId: string,
        updateSettingsDto: UpdateSettingsDto,
    ): Promise<User> {
        const user = await this.findById(userId);
        user.settings = { ...user.settings, ...updateSettingsDto.settings };
        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async deleteUser(userId: string): Promise<void> {
        const result = await this.userRepository.delete(userId);
        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }
    }

    async skipVerification(email: string): Promise<User> {
        const user = await this.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationExpires = null;
        return this.userRepository.save(user);
    }
}
