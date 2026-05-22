import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { YoutubeService } from './youtube/youtube.service';

@Controller()
export class VideoController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Post('recommend-video')
  async recommendVideo(@Body('topic') topic: string) {
    if (!topic) {
      throw new HttpException('Topic is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.youtubeService.getRecommendedVideo(topic);

    if (result.error) {
      throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    }

    return result;
  }
}
