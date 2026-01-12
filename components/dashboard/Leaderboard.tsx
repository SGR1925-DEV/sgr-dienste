'use client';

import { useMemo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Slot } from '@/types';
import { clsx } from 'clsx';

interface LeaderboardProps {
  slots: Slot[];
}

interface LeaderboardEntry {
  userName: string;
  count: number;
}

export default function Leaderboard({ slots }: LeaderboardProps) {
  const topUsers = useMemo(() => {
    // Filter slots with user_name and group by user_name
    const userCounts: Record<string, number> = {};
    
    slots.forEach(slot => {
      if (slot.user_name) {
        userCounts[slot.user_name] = (userCounts[slot.user_name] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count descending
    const entries: LeaderboardEntry[] = Object.entries(userCounts).map(([userName, count]) => ({
      userName,
      count,
    }));
    
    entries.sort((a, b) => b.count - a.count);
    
    // Return top 5
    return entries.slice(0, 5);
  }, [slots]);

  if (topUsers.length === 0) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';
      case 3:
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-white border-slate-100';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Top Helfer der Saison</h2>
      </div>

      <div className="space-y-3">
        {topUsers.map((entry, index) => {
          const rank = index + 1;
          return (
            <div
              key={entry.userName}
              className={clsx(
                'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                getRankStyle(rank)
              )}
            >
              <div className="flex-shrink-0">
                {getRankIcon(rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {entry.userName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {entry.count} {entry.count === 1 ? 'Dienst' : 'Dienste'}
                </div>
              </div>
              {rank <= 3 && (
                <div className="flex-shrink-0">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white',
                    rank === 1 && 'bg-gradient-to-br from-yellow-400 to-yellow-600',
                    rank === 2 && 'bg-gradient-to-br from-slate-400 to-slate-600',
                    rank === 3 && 'bg-gradient-to-br from-amber-500 to-amber-700'
                  )}>
                    {rank}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
