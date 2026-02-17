import { clsx } from 'clsx';

interface LiquidContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Liquid Glass Container Component
 * Creates a glassmorphic container effect with gradient backgrounds and backdrop blur
 */
export default function LiquidContainer({ children, className }: LiquidContainerProps) {
  return (
    <div className={clsx(
      "relative overflow-hidden bg-gradient-to-br from-white/60 to-blue-50/30 backdrop-blur-xl border border-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9)] ring-1 ring-blue-500/5 transition-all",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
