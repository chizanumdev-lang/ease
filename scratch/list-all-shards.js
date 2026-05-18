const fs = require('fs');
const shards = JSON.parse(fs.readFileSync('/Users/chizanumidemili/Projects/ease/research/output/task-shards-enriched.json', 'utf8'));
const categories = ['audio', 'quiz', 'journal', 'consistency'];
categories.forEach(cat => {
    console.log(`\n### CATEGORY: ${cat.toUpperCase()}`);
    const catShards = shards.filter(s => s.category === cat);
    catShards.forEach(s => {
        console.log(`- **${s.name}**: ${s.description}`);
    });
});
