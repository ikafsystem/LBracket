path = '/home/ikaf_ramadhan/LBracket/src/components/match-card.tsx'
with open(path) as f:
    content = f.read()

old = """    <div className={cn(
      'rounded-lg border bg-white shadow-sm overflow-hidden min-w-[140px] border-slate-200',
      match.completed && 'border-blue-200',
      className
    )}>
      {match.label && (
        <div className={cn(
          'px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-b text-slate-500 bg-slate-50',
          match.bracket === 'play-in' && 'text-indigo-500 bg-indigo-50',
          match.bracket === 'grand-final' && 'text-amber-500 bg-amber-50',
        )}>
          {match.label}
        </div>
      )}
      {participantSlot(p1, p1Won, 'top')}"""

new = """    <div className={cn(
      'rounded-lg border bg-white shadow-sm overflow-hidden min-w-[140px] border-slate-200',
      match.completed && 'border-blue-200',
      className
    )}>
      {participantSlot(p1, p1Won, 'top')}"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print('SUCCESS: match-card.tsx updated')
else:
    print('FAILED: old string not found')
