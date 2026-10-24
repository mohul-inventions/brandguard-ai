import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', showLabel = true }) => {
  const getColor = (s: number) => {
    if (s >= 85) return 'text-emerald-400 stroke-emerald-500';
    if (s >= 65) return 'text-amber-400 stroke-amber-500';
    return 'text-red-400 stroke-red-500';
  };

  const getBgColor = (s: number) => {
    if (s >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (s >= 65) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getBgColor(score)}`}>
        <span>{score}%</span>
        {showLabel && <span className="opacity-80">Compliance</span>}
      </div>
    );
  }

  // Circular SVG gauge for md and lg
  const radius = size === 'lg' ? 42 : 32;
  const strokeWidth = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`${size === 'lg' ? 'text-2xl font-bold' : 'text-lg font-bold'} ${getColor(score).split(' ')[0]}`}>
          {score}
        </span>
        {size === 'lg' && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Score</span>}
      </div>
    </div>
  );
};
