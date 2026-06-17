import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { DataSource } from 'typeorm';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    // Only run in development
    if (
      process.env.NODE_ENV === 'development' ||
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === 'local'
    ) {
      this.startOllamaCheck();
    }
  }

  private startOllamaCheck() {
    this.logger.log('🤖 Checking Ollama status...');
    fetch('http://localhost:11434/api/tags')
      .then((res) => {
        if (res.ok) this.logger.log('✅ Ollama is online.');
        else
          this.logger.warn('⚠️ Ollama returned non-OK status. Is it running?');
      })
      .catch(() => {
        this.logger.warn(
          '❌ Ollama is not reachable at http://localhost:11434. Local AI features will be disabled.',
        );
      });
  }
}
