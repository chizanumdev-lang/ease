import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrchestratorService } from '../src/modules/engine/services/orchestrator.service';

async function testOrchestrationFix() {
  console.log('🚀 Bootstrapping NestJS App...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const orchestratorService = app.get(OrchestratorService);

  const goal = 'Speak Up';
  console.log(`\n🔍 Simulating blueprint selection for goal: "${goal}"`);
  try {
    const results = await orchestratorService.simulateBlueprintSelection(goal);
    console.log('\n--- SIMULATED BLUEPRINT SELECTION RESULTS ---');
    results.forEach((r, i) => {
      console.log(`Task ${i + 1}:`);
      console.log(`  Selected Shard Name: ${r.selectedShard}`);
      console.log(`  Modality: ${r.modality}`);
      console.log(`  DisplayName: "${r.displayName}"`);
      console.log(`  Draft ShardName: "${r.draftContent.shardName}"`);
      console.log(`  Draft Category: "${r.draftContent.category}"`);
      console.log(`  Draft Modality: "${r.draftContent.modality}"`);
    });
  } catch (err) {
    console.error('❌ Simulation failed:', err);
  } finally {
    await app.close();
  }
}

testOrchestrationFix();
