'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Match } from '@/types';
import { formatDisplayDate, getDateParts } from '@/lib/utils';

interface MatchListProps {
  matches: Match[];
  openCounts: Record<number, number>;
  isPast?: boolean;
  title: string;
}

/**
 * MatchList Component
 * Displays a list of matches (upcoming or past)
 */
export default function MatchList({ matches, openCounts, isPast = false, title }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{title}</h2>
        <div className="text-center py-12 text-slate-400">
          <p className="text-slate-500 font-medium">
            {isPast ? 'Keine vergangenen Spiele' : 'Keine anstehenden Spiele'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{title}</h2>
      <div className="space-y-3">
        {matches.map((match, i) => {
          const dateParts = getDateParts(match.date);
          const openCount = openCounts[match.id] || 0;
          
          return (
            <Link key={match.id} href={`/match/${match.id}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={clsx(
                  "group p-4 rounded-2xl border shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform",
                  isPast
                    ? "bg-slate-50/50 border-slate-100/50 opacity-75"
                    : "bg-white border-slate-100"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-xl font-bold leading-none border",
                    isPast
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  )}>
                    {dateParts.dayName && (
                      <span className="text-[10px] uppercase opacity-60 mb-0.5">{dateParts.dayName}</span>
                    )}
                    <span className="text-lg">{dateParts.date}</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={clsx(
                        "font-bold text-lg leading-tight",
                        isPast ? "text-slate-500" : "text-slate-800"
                      )}>
                        {match.opponent}
                      </h4>
                      {match.team && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                          {match.team}
                        </span>
                      )}
                    </div>
                    <div className={clsx(
                      "text-xs font-medium mt-1 flex items-center gap-2",
                      isPast ? "text-slate-400" : "text-slate-400"
                    )}>
                      <span>{formatDisplayDate(match.date)} • {match.time} Uhr</span>
                      {!isPast && openCount > 0 && (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                          {openCount} offen
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className={clsx(
                  "w-5 h-5 transition-all",
                  isPast
                    ? "text-slate-300"
                    : "text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1"
                )} />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
