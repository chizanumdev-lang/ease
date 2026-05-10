/**
 * Task Shard Discovery Pipeline v2 (Ollama, one-goal-at-a-time)
 * 
 * Processes each goal individually using Ollama's JSON mode
 * for guaranteed valid output. Then aggregates across all 215 goals.
 * 
 * Usage: npx ts-node research/analyze-goals.ts
 * 
 * Estimated time: ~30-45 min on M-series Mac (llama3.2:3b)
 * Checkpoints every 25 goals so you can resume if interrupted.
 */

import * as fs from 'fs';
import * as path from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const OUTPUT_DIR = path.join(__dirname, 'output');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, '_checkpoint.json');

// ─── Types ────────────────────────────────────────────────────────────────────
interface GoalEntry { id: number; text: string; domain: string; }
interface ShardResult {
  goalId: number;
  domain: string;
  shards: {
    name: string;
    displayName: string;
    modality: string;
    description: string;
    durationMinutes: number;
    energy: string;
  }[];
}
interface ShardAggregate {
  name: string;
  displayName: string;
  modality: string;
  description: string;
  avgDuration: number;
  energy: string;
  goalIds: number[];
  domains: string[];
  count: number;
}

// ─── Parse goals ──────────────────────────────────────────────────────────────
function parseGoals(filePath: string): GoalEntry[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const goals: GoalEntry[] = [];
  let currentDomain = 'General';

  for (const line of raw.split('\n')) {
    const domainMatch = line.match(/^## (.+?) \(/);
    if (domainMatch) { currentDomain = domainMatch[1].trim(); continue; }
    const goalMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (goalMatch) {
      goals.push({ id: parseInt(goalMatch[1]), text: goalMatch[2].trim(), domain: currentDomain });
    }
  }
  return goals;
}

// ─── Call Ollama with JSON mode ───────────────────────────────────────────────
async function analyzeGoal(goal: GoalEntry): Promise<ShardResult | null> {
  const prompt = `Analyze this personal goal and suggest 5 atomic micro-task types that would help someone achieve it.

GOAL: "${goal.text}"
DOMAIN: ${goal.domain}

For each task type, give:
- name: a short kebab-case identifier (e.g. "watch-tutorial", "daily-journal", "spaced-recall-quiz")
- displayName: a human-readable name
- modality: exactly one of: reading, writing, speaking, listening, physical, reflective, social, creative, analytical, practical
- description: one sentence describing what the user does
- durationMinutes: typical duration in minutes (5 to 30)
- energy: one of: low, medium, high

Think about what ACTUALLY builds skill: practice, recall, application, reflection, social accountability.

Return JSON: {"shards": [{"name":"...","displayName":"...","modality":"...","description":"...","durationMinutes":10,"energy":"medium"}]}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json', // Ollama's native JSON mode — guarantees valid JSON
        options: { temperature: 0.6, num_predict: 1500 },
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as any;
    const parsed = JSON.parse(data.response);

    if (parsed.shards && Array.isArray(parsed.shards)) {
      return {
        goalId: goal.id,
        domain: goal.domain,
        shards: parsed.shards.slice(0, 6).map((s: any) => ({
          name: String(s.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 60),
          displayName: String(s.displayName || s.name || '').substring(0, 80),
          modality: String(s.modality || 'practical').toLowerCase(),
          description: String(s.description || '').substring(0, 200),
          durationMinutes: Math.min(30, Math.max(3, Number(s.durationMinutes) || 10)),
          energy: ['low', 'medium', 'high'].includes(s.energy) ? s.energy : 'medium',
        })),
      };
    }
    return null;
  } catch (err: any) {
    return null;
  }
}

// ─── Aggregate shards ─────────────────────────────────────────────────────────
function aggregate(results: ShardResult[]): ShardAggregate[] {
  const map = new Map<string, ShardAggregate>();

  for (const result of results) {
    for (const shard of result.shards) {
      const key = shard.name;
      if (!key) continue;

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.count++;
        if (!existing.goalIds.includes(result.goalId)) existing.goalIds.push(result.goalId);
        if (!existing.domains.includes(result.domain)) existing.domains.push(result.domain);
        existing.avgDuration = (existing.avgDuration * (existing.count - 1) + shard.durationMinutes) / existing.count;
      } else {
        map.set(key, {
          name: shard.name,
          displayName: shard.displayName,
          modality: shard.modality,
          description: shard.description,
          avgDuration: shard.durationMinutes,
          energy: shard.energy,
          goalIds: [result.goalId],
          domains: [result.domain],
          count: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ─── Output generators ───────────────────────────────────────────────────────
function generateCatalog(shards: ShardAggregate[]): string {
  const byModality = new Map<string, ShardAggregate[]>();
  for (const s of shards) {
    if (!byModality.has(s.modality)) byModality.set(s.modality, []);
    byModality.get(s.modality)!.push(s);
  }

  let md = `# Ease Task Shard Catalog\n\n`;
  md += `> Generated from AI analysis of 215 diverse human goals.\n\n`;
  md += `**Total unique shard types: ${shards.length}**\n\n---\n\n`;

  for (const [mod, modShards] of byModality) {
    md += `## ${mod.charAt(0).toUpperCase() + mod.slice(1)} (${modShards.length} shards)\n\n`;
    md += `| Shard | Avg Duration | Energy | # Goals | Domains |\n`;
    md += `|-------|-------------|--------|---------|----------|\n`;
    for (const s of modShards.sort((a, b) => b.count - a.count).slice(0, 30)) {
      md += `| **${s.displayName}** — ${s.description.substring(0, 50)}… | ${Math.round(s.avgDuration)}min | ${s.energy} | ${s.goalIds.length} | ${s.domains.slice(0, 3).join(', ')} |\n`;
    }
    md += `\n`;
  }
  return md;
}

function generateSeedSql(shards: ShardAggregate[]): string {
  let sql = `-- Auto-generated task shard seed data\n`;
  sql += `-- Run: psql $DATABASE_URL < research/output/seed-task-shards.sql\n\n`;
  sql += `CREATE TABLE IF NOT EXISTS task_shards (\n`;
  sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
  sql += `  name VARCHAR(100) UNIQUE NOT NULL,\n`;
  sql += `  display_name VARCHAR(200) NOT NULL,\n`;
  sql += `  modality VARCHAR(50) NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  sql += `  typical_duration_minutes INT DEFAULT 5,\n`;
  sql += `  energy_level VARCHAR(20) DEFAULT 'medium',\n`;
  sql += `  difficulty_base INT DEFAULT 3,\n`;
  sql += `  xp_reward INT DEFAULT 20,\n`;
  sql += `  skill_targets JSONB DEFAULT '[]',\n`;
  sql += `  ai_prompt_template JSONB DEFAULT '{}',\n`;
  sql += `  metadata JSONB DEFAULT '{}',\n`;
  sql += `  created_at TIMESTAMPTZ DEFAULT NOW()\n`;
  sql += `);\n\n`;

  const top = shards.slice(0, 60);
  if (!top.length) return sql + '-- No shards found.\n';

  sql += `INSERT INTO task_shards (name, display_name, modality, description, typical_duration_minutes, energy_level, xp_reward)\nVALUES\n`;
  const esc = (s: string) => s.replace(/'/g, "''").substring(0, 200);
  sql += top.map((s, i) => {
    const xp = Math.max(10, Math.round(s.avgDuration * 4));
    return `  ('${esc(s.name)}', '${esc(s.displayName)}', '${esc(s.modality)}', '${esc(s.description)}', ${Math.round(s.avgDuration)}, '${s.energy}', ${xp})${i < top.length - 1 ? ',' : ';'}`;
  }).join('\n');

  sql += `\n\nSELECT COUNT(*) AS seeded_shards FROM task_shards;\n`;
  return sql;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const goals = parseGoals(path.join(__dirname, 'goal-prompts.md'));
  console.log(`📋 Parsed ${goals.length} goals across ${new Set(goals.map(g => g.domain)).size} domains.`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Check Ollama
  try {
    await fetch(`${OLLAMA_URL}/api/tags`);
    console.log(`✓ Ollama connected (${OLLAMA_MODEL})\n`);
  } catch {
    console.error(`✗ Ollama not running. Start with: ollama serve`);
    process.exit(1);
  }

  // Load checkpoint if exists
  let results: ShardResult[] = [];
  let startFrom = 0;

  if (fs.existsSync(CHECKPOINT_FILE)) {
    const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    results = checkpoint.results || [];
    startFrom = checkpoint.lastGoalId || 0;
    console.log(`⏩ Resuming from checkpoint (goal ${startFrom}, ${results.length} results cached)\n`);
  }

  const remaining = goals.filter(g => g.id > startFrom);
  console.log(`Processing ${remaining.length} goals (1 at a time, ~5-10s each)...\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < remaining.length; i++) {
    const goal = remaining[i];
    const pct = Math.round(((startFrom ? results.length : 0) + i + 1) / goals.length * 100);
    process.stdout.write(`  [${pct.toString().padStart(3)}%] Goal ${goal.id.toString().padStart(3)}: ${goal.text.substring(0, 55).padEnd(55)} `);

    const startTime = Date.now();
    const result = await analyzeGoal(goal);

    if (result && result.shards.length > 0) {
      results.push(result);
      success++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✓ ${result.shards.length} shards (${elapsed}s)`);
    } else {
      fail++;
      console.log(`✗ failed`);
    }

    // Checkpoint every 25 goals
    if ((i + 1) % 25 === 0) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastGoalId: goal.id, results }));
      console.log(`  💾 Checkpoint saved (${results.length} results)\n`);
    }
  }

  // Final save
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastGoalId: goals[goals.length - 1].id, results }));

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  Completed: ${success} succeeded, ${fail} failed`);
  console.log(`${'═'.repeat(70)}\n`);

  // Aggregate
  const shards = aggregate(results);
  console.log(`🧩 Discovered ${shards.length} unique task shard types.\n`);

  // Top shards
  console.log('  TOP 40 UNIVERSAL SHARDS:');
  console.log(`  ${'─'.repeat(85)}`);
  for (const s of shards.slice(0, 40)) {
    const cnt = s.count.toString().padStart(3);
    const name = s.displayName.substring(0, 32).padEnd(32);
    const mod = s.modality.substring(0, 11).padEnd(11);
    const doms = s.domains.slice(0, 3).join(', ').substring(0, 30);
    console.log(`  ${cnt}x  ${name} [${mod}] ${s.energy.padEnd(6)} ~${Math.round(s.avgDuration).toString().padStart(2)}min  ${doms}`);
  }

  // Write outputs
  fs.writeFileSync(path.join(OUTPUT_DIR, 'raw-analysis.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'task-shards.json'), JSON.stringify(shards, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'task-shard-catalog.md'), generateCatalog(shards));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'seed-task-shards.sql'), generateSeedSql(shards));

  console.log(`\n📁 Output saved:`);
  console.log(`   research/output/raw-analysis.json  (full results)`);
  console.log(`   research/output/task-shards.json    (aggregated shards)`);
  console.log(`   research/output/task-shard-catalog.md`);
  console.log(`   research/output/seed-task-shards.sql`);
}

main().catch(console.error);
