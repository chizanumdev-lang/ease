import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Program } from '../src/programs/entities/program.entity';
import { DayPlan } from '../src/programs/entities/day-plan.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Quiz } from '../src/quizzes/entities/quiz.entity';
import { AudioTrack } from '../src/audio/entities/audio-track.entity';
import { Goal } from '../src/goals/entities/goal.entity';

// URL from .env (hardcoded for script convenience)
const DATABASE_URL = 'postgresql://neondb_owner:npg_mDQnO8F3lsWB@ep-small-sound-aizyaehd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const AppDataSource = new DataSource({
    type: "postgres",
    url: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    entities: [User, Program, DayPlan, Task, Quiz, AudioTrack, Goal],
    synchronize: false,
});

async function run() {
    console.log('Initializing Data Source...');
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    const userEmail = 'test11@gmail.com';
    const userRepo = AppDataSource.getRepository(User);
    const programRepo = AppDataSource.getRepository(Program);
    const dayPlanRepo = AppDataSource.getRepository(DayPlan);

    const start = Date.now();
    const user = await userRepo.findOne({ where: { email: userEmail } });
    if (!user) {
        console.log('User not found');
        return;
    }
    console.log(`User found: ${user.id} (${Date.now() - start}ms)`);

    const programStart = Date.now();
    const program = await programRepo.findOne({ where: { userId: user.id } });

    if (!program) {
        console.log('Program not found');
        return;
    }
    console.log(`Program found: ${program.id} (${Date.now() - programStart}ms)`);

    const planStart = Date.now();
    // Simulate the OPTIMIZED query
    const plan = await dayPlanRepo.findOne({
        where: { program: { id: program.id }, dayNumber: 1 },
        relations: ['tasks', 'audioTracks', 'quizzes'],
    });

    console.log(`Plan loaded: ${plan ? 'Yes' : 'No'} (${Date.now() - planStart}ms)`);
    if (plan) {
        console.log(`Tasks: ${plan.tasks.length}`);
    }

    await AppDataSource.destroy();
}

run().catch(error => console.log(error));
