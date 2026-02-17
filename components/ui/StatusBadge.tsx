import { CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  openCount: number;
  variant?: 'default' | 'compact';
}

/**
 * Status Badge Component
 * Displays the status of open service slots with color-coded indicators
 * - Green: All slots filled (openCount === 0)
 * - Yellow: Some slots open (openCount <= 2)
 * - Red: Many slots open (openCount > 2)
 */
export default function StatusBadge({ openCount, variant = 'default' }: StatusBadgeProps) {
  if (openCount === 0) {
    return (
      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Alles belegt
      </span>
    );
  }

  return (
    <span className={clsx(
      "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
      openCount > 2 ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"
    )}>
      <AlertCircle className="w-3 h-3" /> {openCount} Dienste offen
    </span>
  );
}
