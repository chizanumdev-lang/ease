import re

with open('src/programs/programs.service.ts', 'r') as f:
    ps_content = f.read()

with open('src/programs/programs-orchestrator.service.ts', 'r') as f:
    pos_content = f.read()

# Extract imports
def extract_imports(content):
    imports = []
    lines = content.split('\n')
    for line in lines:
        if line.startswith('import '):
            imports.append(line)
    return imports

all_imports = set(extract_imports(ps_content) + extract_imports(pos_content))

# We also need AUDIO_TRACKS and pickAudioUrl from POS
top_level_matches = re.search(r'(const AUDIO_TRACKS.*?function pickAudioUrl.*?})', pos_content, re.DOTALL)
top_level = top_level_matches.group(1) if top_level_matches else ''

# Get ProgramsOrchestratorService class body
pos_body_match = re.search(r'export class ProgramsOrchestratorService \{.*?(constructor.*?)\}(.*)', pos_content, re.DOTALL)
pos_constructor = pos_body_match.group(1) if pos_body_match else ''
pos_methods_start = pos_constructor.find('{}') + 2
pos_methods = pos_constructor[pos_methods_start:].strip()
pos_methods = pos_methods[:-1] # remove last brace

# Now merge into ProgramsService
ps_lines = ps_content.split('\n')
new_imports = list(all_imports)
new_imports = [imp for imp in new_imports if 'ProgramsOrchestratorService' not in imp]
new_imports_str = '\n'.join(new_imports)

ps_body_match = re.search(r'export class ProgramsService \{(.*?)\}', ps_content, re.DOTALL)
ps_body = ps_body_match.group(1) if ps_body_match else ''

# We need to manually write the merged constructor and methods.
# Since it's complex, I'll just rewrite the file content entirely.
