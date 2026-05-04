
const { createConnection } = require('typeorm');
const { AnalyticsService } = require('./dist/analytics/analytics.service');
const { CheckIn } = require('./dist/progress/entities/check-in.entity');
const { Task } = require('./dist/tasks/entities/task.entity');
const { QuizAttempt } = require('./dist/quizzes/entities/quiz-attempt.entity');
const { DayPlan } = require('./dist/programs/entities/day-plan.entity');
const { Program } = require('./dist/programs/entities/program.entity');
const { RewardEvent } = require('./dist/rewards/entities/reward-event.entity');
const { ProgressionService } = require('./dist/programs/progression.service');

async function test() {
    try {
        console.log('Testing AnalyticsService...');
        // This is a dummy test to see if we can at least instantiate and check logic
        // Real testing would need a DB connection
    } catch (e) {
        console.error(e);
    }
}
test();
