import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Ease API - v1.0.6-MIXING-RESTORED';
  }
}
