import os, json, glob
from collections import Counter

home = os.path.expanduser('~')
pattern = os.path.join(home, '.claude', 'projects', '**', '*.jsonl')
files = glob.glob(pattern, recursive=True)
files.sort(key=lambda f: os.path.getmtime(f), reverse=True)
files = files[:50]

bash_cmds = Counter()
mcp_tools = Counter()

for fpath in files:
    try:
        with open(fpath) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                msg = obj.get('message', {})
                if msg.get('role') != 'assistant':
                    continue
                for item in msg.get('content', []):
                    if item.get('type') != 'tool_use':
                        continue
                    name = item.get('name', '')
                    inp = item.get('input', {})
                    if name == 'Bash':
                        cmd = inp.get('command', '').strip()
                        tokens = cmd.split()
                        i = 0
                        while i < len(tokens) and '=' in tokens[i].split('(')[0]:
                            i += 1
                        if i < len(tokens):
                            lead = tokens[i]
                            sub = None
                            if i+1 < len(tokens):
                                nxt = tokens[i+1]
                                if not nxt.startswith('-') and not nxt.startswith('/') and not nxt.startswith('~') and nxt.isalpha():
                                    sub = nxt
                            key = lead if sub is None else (lead + ' ' + sub)
                            bash_cmds[key] += 1
                    elif name.startswith('mcp__'):
                        mcp_tools[name] += 1
    except Exception:
        pass

print('=== TOP BASH COMMANDS ===')
for cmd, cnt in bash_cmds.most_common(60):
    print(f'{cnt:4d}  {cmd}')
print()
print('=== TOP MCP TOOLS ===')
for tool, cnt in mcp_tools.most_common(40):
    print(f'{cnt:4d}  {tool}')
print()
print(f'Files scanned: {len(files)}')
