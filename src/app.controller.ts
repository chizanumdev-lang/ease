import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/admin', 301)
  redirectToAdmin() {}

  @Get('debug-sentry')
  getError() {
    throw new Error('Sentry Backend Test Error');
  }
}
