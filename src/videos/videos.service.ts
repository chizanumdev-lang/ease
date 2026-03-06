import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video } from './entities/video.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
  ) { }

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    const video = this.videosRepository.create(createVideoDto);
    return this.videosRepository.save(video);
  }

  async findAll(): Promise<Video[]> {
    return this.videosRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videosRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.findOne(id);
    Object.assign(video, updateVideoDto);
    return this.videosRepository.save(video);
  }

  async remove(id: string): Promise<void> {
    const result = await this.videosRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
  }
}
