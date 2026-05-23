const fs = require('fs');
const path = './src/programs/programs.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix error messages
content = content.replace(/\(err\) =>/g, '(err: any) =>');
content = content.replace(/catch \((e|err)\)/g, 'catch ($1: any)');
content = content.replace(/\$\{err\.message\}/g, '${err instanceof Error ? err.message : String(err)}');
content = content.replace(/\$\{e\.message\}/g, '${e instanceof Error ? e.message : String(e)}');

// Fix async without await
content = content.replace(/async calculateCurrentDayNumber/g, 'calculateCurrentDayNumber');

// Fix i unused
content = content.replace(/const i of \[\.\.\.Array\(missingDays\)\]\.keys\(\)/g, 'const _ of [...Array(missingDays)].keys()');
content = content.replace(/let i = 1/g, 'let _i = 1');

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed simple lint errors');
