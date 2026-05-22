import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { DataSource } from 'typeorm';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    // Run schema fixes globally
    await this.runDynamicSchemaFixes();

    // Only run in development
    if (
      process.env.NODE_ENV === 'development' ||
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === 'local'
    ) {
      this.startTriggerDev();
      this.startOllamaCheck();
    }
  }

  private async runDynamicSchemaFixes() {
    this.logger.log('🛠️ Running dynamic database schema fixes...');
    try {
      await this.dataSource.query(`
        DO $$ 
        BEGIN 
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='reward_events' AND column_name='type'
            ) THEN 
                ALTER TABLE reward_events ALTER COLUMN type DROP NOT NULL;
            END IF;
        END $$;
      `);
      this.logger.log('✅ Dynamic schema fixes completed successfully.');
    } catch (err: any) {
      this.logger.error(`❌ Dynamic schema fix failed: ${err.message}`);
    }
  }

  private startTriggerDev() {
    this.logger.log('🚀 Checking trigger.dev status...');

    exec(
      'ps aux | grep "trigger.dev" | grep "dev" | grep -v grep',
      (err, stdout) => {
        if (stdout && stdout.trim().length > 0) {
          this.logger.log('✅ trigger.dev is already running.');
          return;
        }

        this.logger.log('📡 Starting trigger.dev background worker...');
        // Use nohup or detached to keep it alive
        const proc = exec(
          'npx trigger.dev@latest dev > trigger-dev.log 2>&1 &',
          (error) => {
            if (error) {
              this.logger.error(
                `❌ Failed to start trigger.dev: ${error.message}`,
              );
            }
          },
        );

        this.logger.log(
          '📦 trigger.dev process initiated (logs in trigger-dev.log)',
        );
      },
    );
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
