import { DataSource } from 'typeorm';
import { AiGenerationLog } from './src/admin/entities/ai-generation-log.entity';

const ds = new DataSource({
  type: 'postgres',
  url: 'postgres://postgres.yubswavvjixhszewixvw:chizanumdev-ease1234@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  entities: [AiGenerationLog],
  ssl: { rejectUnauthorized: false } // THIS URL IS FOR STAGING. Wait, the staging url was used in a previous session.
});

async function run() {
  await ds.initialize();
  const log = await ds.getRepository(AiGenerationLog).findOne({
    where: { model: 'openrouter' },
    order: { createdAt: 'DESC' }
  });
  console.log(log?.response);
  process.exit(0);
}
run();
