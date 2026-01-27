'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { SlotPublic } from '@/types';

interface HallOfFameProps {
  slots: SlotPublic[];
}

interface HallOfFameEntry {
  name: string;
  count: number;
}

export default function HallOfFame({ slots }: HallOfFameProps) {
  const topEntries = useMemo(() => {
    const userCounts = new Map<string, { name: string; count: number }>();

    slots.forEach(slot => {
      if (!slot.user_name) return;
      const trimmed = slot.user_name.trim();
      if (!trimmed) return;

      const key = trimmed.toLowerCase();
      const existing = userCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        userCounts.set(key, { name: trimmed, count: 1 });
      }
    });

    const entries: HallOfFameEntry[] = Array.from(userCounts.values()).map(entry => ({
      name: entry.name,
      count: entry.count,
    }));

    entries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'de');
    });

    return entries.slice(0, 5);
  }, [slots]);

  if (topEntries.length === 0) {
    return null;
  }

  const topThree = topEntries.slice(0, 3);
  const rest = topEntries.slice(3);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    return '🥉';
  };

  const getCountLabel = (count: number) => (count === 1 ? 'Einsatz' : 'Einsätze');

  return (
    <section>
      <div className="relative rounded-[2rem] p-[1px] bg-gradient-to-br from-yellow-200/80 via-amber-100/40 to-transparent shadow-[0_0_30px_rgba(250,204,21,0.2)]">
        <div className="relative rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/70 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-slate-900">Helfer-Helden der Saison 🏆</h2>
            <div className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-1 rounded-full border border-amber-200">
              Danke!
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {topThree.map((entry, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              return (
                <div
                  key={entry.name}
                  className={clsx(
                    'rounded-2xl border p-3 flex flex-col items-center text-center',
                    isFirst
                      ? 'bg-white/80 border-yellow-200 shadow-md'
                      : 'bg-white/50 border-white/70'
                  )}
                >
                  <div
                    className={clsx(
                      'flex items-center justify-center rounded-full',
                      isFirst ? 'h-12 w-12 text-3xl' : 'h-10 w-10 text-2xl'
                    )}
                  >
                    {getMedal(rank)}
                  </div>
                  <div className={clsx('mt-2 font-bold text-slate-900 truncate w-full', isFirst ? 'text-sm' : 'text-[11px]')}>
                    {entry.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {entry.count} {getCountLabel(entry.count)}
                  </div>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <div className="mt-4 space-y-2">
              {rest.map((entry, index) => {
                const rank = index + 4;
                return (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between bg-white/50 border border-white/70 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                        {rank}
                      </div>
                      <div className="text-sm font-bold text-slate-800 truncate">{entry.name}</div>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {entry.count} {getCountLabel(entry.count)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
