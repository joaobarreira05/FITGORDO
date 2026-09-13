import React from 'react';

interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClass: string;
  bgClass: string;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  label,
  current,
  target,
  unit,
  colorClass,
  bgClass,
}) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const remaining = Math.max(roundOneDec(target - current), 0);

  function roundOneDec(num: number) {
    return Math.round(num * 10) / 10;
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 p-3.5 rounded-2xl">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-zinc-300">{label}</span>
        <span className="text-zinc-400 font-mono">
          <strong className="text-white font-bold">{current}</strong> / {target} {unit}
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className={`w-full h-2.5 rounded-full overflow-hidden ${bgClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] mt-1.5 text-zinc-400">
        <span>{percentage}% atingido</span>
        <span>
          Faltam <strong className="text-zinc-200">{remaining} {unit}</strong>
        </span>
      </div>
    </div>
  );
};
