const fs = require('fs');
const path = require('path');

const shardsPath = '/Users/chizanumidemili/Projects/ease/artifacts/unique_shards.txt';
const shards = fs.readFileSync(shardsPath, 'utf8').split('\n').filter(Boolean);

const mapping = {
    video: [],
    audio: [],
    quiz: [],
    journal: [],
    reflection: [],
    micro_app: [],
    consistency: []
};

shards.forEach(line => {
    const [name, modality] = line.split('|');
    const n = name.toLowerCase();
    const m = (modality || '').toLowerCase();

    let type = 'video'; // Default

    // High Priority Key-based Mapping
    if (n.includes('quiz') || n.includes('test') || n.includes('exam') || n.includes('recall')) {
        type = 'quiz';
    } else if (n.includes('journal') || n.includes('write') || n.includes('log') || n.includes('entry') || n.includes('diary')) {
        type = 'journal';
    } else if (n.includes('watch') || n.includes('video') || n.includes('tutorial') || n.includes('visual')) {
        type = 'video';
    } else if (n.includes('listen') || n.includes('audio') || n.includes('podcast') || n.includes('meditation')) {
        type = 'audio';
    } else if (n.includes('reflection') || n.includes('mood') || n.includes('check-in')) {
        type = 'reflection';
    } else if (n.includes('habit') || n.includes('consistency') || n.includes('commitment') || n.includes('streak')) {
        type = 'consistency';
    } else if (n.includes('practice') || n.includes('drill') || n.includes('exercise') || n.includes('app') || n.includes('session')) {
        type = 'micro_app';
    } 
    // Modality-based fallback
    else if (m.includes('watch') || m.includes('video') || m.includes('visual')) {
        type = 'video';
    } else if (m.includes('write') || m.includes('journal') || m.includes('writing')) {
        type = 'journal';
    } else if (m.includes('listen') || m.includes('audio')) {
        type = 'audio';
    } else if (m.includes('reflect')) {
        type = 'reflection';
    } else if (m.includes('quiz') || m.includes('test') || m.includes('remember')) {
        type = 'quiz';
    } else if (m.includes('practical') || m.includes('physical') || m.includes('social') || m.includes('creative')) {
        type = 'micro_app';
    } else if (m.includes('habit') || m.includes('consistency')) {
        type = 'consistency';
    }

    mapping[type.replace('-', '_')].push(name);
});

// Generate Markdown Report
let report = '# Task Functionality Mapping\n\n';
report += 'This document maps all unique task shards to their corresponding mobile task modules.\n\n';

Object.entries(mapping).forEach(([type, items]) => {
    report += `## ${type.toUpperCase().replace('_', ' ')} (${items.length})\n`;
    items.sort().forEach(item => {
        report += `- ${item}\n`;
    });
    report += '\n';
});

fs.writeFileSync('/Users/chizanumidemili/Projects/ease/artifacts/task_functionality_report.md', report);
console.log('Report generated at /Users/chizanumidemili/Projects/ease/artifacts/task_functionality_report.md');
