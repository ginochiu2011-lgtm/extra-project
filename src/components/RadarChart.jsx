import React, { memo, useMemo } from 'react';

export const RadarChart = memo(({ stats, color = "#108542", size = 120 }) => {
  const points = useMemo(() => stats.map((stat, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (stat / 100) * (size / 2);
    return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
  }).join(" "), [stats, size]);

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} className="overflow-visible drop-shadow-sm transition-all duration-500">
      {gridLevels.map(level => {
        const gp = [0, 1, 2, 3, 4].map(i => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = (level / 100) * (size / 2);
          return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={level} points={gp} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />;
      })}
      <polygon points={points} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
    </svg>
  );
});

