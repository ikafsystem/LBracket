import json
with open('public/teams.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f'Total leagues: {len(data)}')
total = sum(len(l['teams']) for l in data)
print(f'Total unique teams: {total}')
print()
for l in data:
    print(f'{l["league"]}: {len(l["teams"])} teams')
