const fs = require('fs');
const shards = JSON.parse(fs.readFileSync('/Users/chizanumidemili/Projects/ease/research/output/task-shards-enriched.json', 'utf8'));
const videoShards = shards.filter(s => s.category === 'video');
videoShards.forEach(s => {
    console.log(`- **${s.name}**: ${s.description}`);
});
