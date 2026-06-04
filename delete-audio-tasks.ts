import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
});

AppDataSource.initialize()
  .then(async () => {
    const result = await AppDataSource.query(`DELETE FROM tasks WHERE type = 'audio'`);
    console.log('Deleted audio tasks:', result);
    process.exit(0);
  })
  .catch((error) => console.log(error));
