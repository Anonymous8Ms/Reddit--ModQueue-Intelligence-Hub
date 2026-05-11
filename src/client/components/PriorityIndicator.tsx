import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PriorityIndicatorProps {
  score: number;
  reasoning?: string;
  className?: string;
}

export function PriorityIndicator({ score, reasoning, className }: PriorityIndicatorProps) {
  let level = 'Low';
  let colorClass = 'bg-green-500';
  let badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';

  if (score >= 4) {
    level = 'Critical';
    colorClass = 'bg-red-600';
    badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  } else if (score >= 3) {
    level = 'High';
    colorClass = 'bg-orange-500';
    badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  } else if (score >= 2) {
    level = 'Medium';
    colorClass = 'bg-yellow-500';
    badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }

  return (
    <div
      className={twMerge('group relative flex items-center gap-2', className)}
      title={reasoning || `Priority Score: ${score}/5`}
    >
      <div className={clsx('flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeClass)}>
        <span className={clsx('w-2 h-2 rounded-full mr-1.5', colorClass)} />
        {level} ({score.toFixed(1)})
      </div>

      {reasoning && (
        <div className="absolute left-0 bottom-full mb-2 hidden w-48 bg-gray-900 text-white text-xs rounded p-2 z-10 group-hover:block shadow-lg">
          {reasoning}
        </div>
      )}
    </div>
  );
}