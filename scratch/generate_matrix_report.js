const fs = require('fs');
const path = require('path');

const shardsPath = '/Users/chizanumidemili/Projects/ease/artifacts/unique_shards.txt';
const shards = fs.readFileSync(shardsPath, 'utf8').split('\n').filter(Boolean);

const patterns = {
    'QUIZ:vocal-test': [],
    'QUIZ:spaced-recall': [],
    'QUIZ:mcq-standard': [],
    'QUIZ:translation-match': [],
    'VIDEO:lesson-video': [],
    'VIDEO:immersive-visual': [],
    'AUDIO:guided-session': [],
    'AUDIO:audio-lecture': [],
    'JOURNAL:free-write': [],
    'JOURNAL:structured-log': [],
    'MICRO_APP:breathwork-sync': [],
    'MICRO_APP:action-drill': [],
    'MICRO_APP:social-share': [],
    'REFLECTION:sentiment-check': [],
    'CONSISTENCY:habit-toggle': [],
    'OTHER:unsorted': []
};

shards.forEach(line => {
    const [name, modality] = line.split('|');
    const n = name.toLowerCase();
    const m = (modality || '').toLowerCase();

    let pattern = 'OTHER:unsorted';

    // VOCAL TEST (Highest priority for language/speaking)
    if (n.includes('vocal') || n.includes('speak') || n.includes('pronunciation') || n.includes('converse') || n.includes('conversation') || n.includes('interpreting')) {
        pattern = 'QUIZ:vocal-test';
    }
    // SPACED RECALL
    else if (n.includes('recall') || n.includes('kanji') || n.includes('flashcard') || n.includes('memorization') || n.includes('vocabulary-quiz')) {
        pattern = 'QUIZ:spaced-recall';
    }
    // TRANSLATION MATCH
    else if (n.includes('match') || n.includes('translation') || n.includes('pinyin')) {
        pattern = 'QUIZ:translation-match';
    }
    // MCQ STANDARD
    else if (n.includes('quiz') || n.includes('test') || n.includes('exam') || n.includes('questions')) {
        pattern = 'QUIZ:mcq-standard';
    }
    // BREATHWORK
    else if (n.includes('breath') || n.includes('breathing')) {
        pattern = 'MICRO_APP:breathwork-sync';
    }
    // ACTION DRILL
    else if (n.includes('practice') || n.includes('drill') || n.includes('exercise') || n.includes('workout') || n.includes('physical') || n.includes('pull-up') || n.includes('running') || n.includes('stretching')) {
        pattern = 'MICRO_APP:action-drill';
    }
    // SOCIAL SHARE
    else if (n.includes('social') || n.includes('accountability') || n.includes('share') || n.includes('group') || n.includes('community') || n.includes('partner')) {
        pattern = 'MICRO_APP:social-share';
    }
    // STRUCTURED LOG
    else if (n.includes('log') || n.includes('tracker') || n.includes('track') || n.includes('budget') || n.includes('diary') || n.includes('calculate') || n.includes('counting')) {
        pattern = 'JOURNAL:structured-log';
    }
    // FREE WRITE
    else if (n.includes('journal') || n.includes('write') || n.includes('essay') || n.includes('article') || n.includes('reflection') || n.includes('entry')) {
        pattern = 'JOURNAL:free-write';
    }
    // GUIDED SESSION
    else if (n.includes('meditation') || n.includes('guided') || n.includes('session') || n.includes('mindfulness')) {
        pattern = 'AUDIO:guided-session';
    }
    // AUDIO LECTURE
    else if (n.includes('audio') || n.includes('podcast') || n.includes('listen')) {
        pattern = 'AUDIO:audio-lecture';
    }
    // SENTIMENT CHECK
    else if (n.includes('mood') || n.includes('check-in') || n.includes('sentiment')) {
        pattern = 'REFLECTION:sentiment-check';
    }
    // HABIT TOGGLE
    else if (n.includes('habit') || n.includes('consistency') || n.includes('commitment')) {
        pattern = 'CONSISTENCY:habit-toggle';
    }
    // LESSON VIDEO
    else if (n.includes('watch') || n.includes('tutorial') || n.includes('video') || n.includes('visual')) {
        pattern = 'VIDEO:lesson-video';
    }
    // IMMERSIVE VISUAL (Fallback for things that are more "Content" than "Action")
    else if (m.includes('watch') || m.includes('reading') || m.includes('visual')) {
        pattern = 'VIDEO:lesson-video';
    } else if (m.includes('listening')) {
        pattern = 'AUDIO:audio-lecture';
    } else if (m.includes('writing')) {
        pattern = 'JOURNAL:free-write';
    }

    if (patterns[pattern]) {
        patterns[pattern].push(name);
    } else {
        patterns['OTHER:unsorted'].push(name);
    }
});

// Generate Markdown Report
let report = '# Master Interaction Matrix Review\n\n';
report += 'This document groups all 758 shards into specific interaction patterns. Review these groups to ensure the "Logic" matches the "Task".\n\n';

Object.entries(patterns).forEach(([pattern, items]) => {
    if (items.length === 0) return;
    const [module, type] = pattern.split(':');
    report += `## ${module} > ${type.toUpperCase().replace('-', ' ')} (${items.length})\n`;
    items.sort().forEach(item => {
        report += `- ${item}\n`;
    });
    report += '\n';
});

fs.writeFileSync('/Users/chizanumidemili/Projects/ease/artifacts/interaction_matrix_review.md', report);
console.log('Interaction Matrix Review generated at /Users/chizanumidemili/Projects/ease/artifacts/interaction_matrix_review.md');
