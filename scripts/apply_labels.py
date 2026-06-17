path = '/home/ikaf_ramadhan/LBracket/src/components/double-elimination-bracket.tsx'
with open(path) as f:
    content = f.read()

old = """          {connectors.map(({ from, to }) => {
            const x1 = from.cx + ROUND_W / 2 - 8;
            const y1 = from.cy;
            const x2 = to.cx - ROUND_W / 2 + 8;
            const y2 = to.cy;
            const midX = (x1 + x2) / 2;

            const path = y1 === y2
              ? `M ${x1} ${y1} L ${x2} ${y2}`
              : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            const isGfConnector = to.match.bracket === 'grand-final';

            return (
              <path
                key={`${from.match.id}-${to.match.id}`}
                d={path}
                fill="none"
                stroke={isGfConnector ? '#f59e0b' : '#475569'}
                strokeWidth={isGfConnector ? 2 : 1.5}
                strokeLinejoin="round"
              />
            );
          })}"""

new = """          {connectors.map(({ from, to }) => {
            const x1 = from.cx + ROUND_W / 2 - 8;
            const y1 = from.cy;
            const x2 = to.cx - ROUND_W / 2 + 8;
            const y2 = to.cy;
            const midX = (x1 + x2) / 2;

            const path = y1 === y2
              ? `M ${x1} ${y1} L ${x2} ${y2}`
              : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            const isGfConnector = to.match.bracket === 'grand-final';
            const label = from.match.label;
            const strokeColor = isGfConnector ? '#f59e0b' : '#475569';
            const labelW = label ? label.length * 8 + 16 : 0;

            return (
              <g key={`${from.match.id}-${to.match.id}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isGfConnector ? 2 : 1.5}
                  strokeLinejoin="round"
                />
                {label && (
                  <g>
                    <rect
                      x={midX - labelW / 2}
                      y={y1 - 8}
                      width={labelW}
                      height={16}
                      rx={4}
                      ry={4}
                      fill="#fff"
                      stroke={strokeColor}
                      strokeWidth={1}
                    />
                    <text
                      x={midX}
                      y={y1 + 4}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize={9}
                      fontWeight="bold"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print('SUCCESS: double-elimination-bracket.tsx updated')
else:
    print('FAILED: old string not found')
