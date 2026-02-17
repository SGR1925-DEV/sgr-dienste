'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { Match } from '@/types';
import { getMatchDisplayDate } from '@/lib/utils';

interface MatchHeroProps {
  match: Match;
  openCount: number;
  progress: number;
}

/**
 * MatchHero Component
 * Large highlighted card for the next upcoming match
 */
export default function MatchHero({ match, openCount, progress }: MatchHeroProps) {
  return (
    <section>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-lg font-bold text-slate-800">Als nächstes</h2>
      </div>

      <Link href={`/match/${match.id}`}>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100"
        >
          <div className={clsx(
            "absolute top-0 left-0 w-full h-2",
            openCount === 0 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-600 to-indigo-600"
          )} />

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Calendar className="w-4 h-4 text-blue-500" />
                {getMatchDisplayDate(match.match_date, match.date)} • {match.time}
              </div>
              {openCount > 2 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-2xl shadow-inner border border-slate-100">
                ⚽️
              </div>
              {match.team && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2 border border-blue-100">
                  {match.team}
                </span>
              )}
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                {match.opponent}
              </h3>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {match.location || 'Sportplatz Kasel'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex justify-between text-sm mb-2 font-semibold">
                <span className="text-slate-600">Dienstplan Status</span>
                <span className={clsx(
                  openCount === 0 ? "text-emerald-600" : "text-blue-600"
                )}>
                  {progress}% Belegt
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full transition-all duration-1000 ease-out rounded-full",
                    openCount === 0 ? "bg-emerald-500" : "bg-blue-600"
                  )}
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <span>Noch {openCount} Helfer gesucht</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </section>
  );
}
