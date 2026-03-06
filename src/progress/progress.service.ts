import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class ProgressService {
    constructor(
        @InjectRepository(Progress)
        private progressRepository: Repository<Progress>,
    ) { }

    async createCheckin(
        userId: string,
        createCheckinDto: CreateCheckinDto,
    ): Promise<Progress> {
        const progress = this.progressRepository.create({
            ...createCheckinDto,
            checkinDate: createCheckinDto.checkinDate
                ? new Date(createCheckinDto.checkinDate)
                : new Date(),
            userId,
        });

        return this.progressRepository.save(progress);
    }

    async findRecent(userId: string): Promise<Progress[]> {
        return this.progressRepository.find({
            where: { userId },
            order: { checkinDate: 'DESC' },
            take: 7,
        });
    }
}
