'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, SlotPublic } from '@/types';
import NextLink from 'next/link';
import { Calendar, Shield, Lock, History, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { getMatchDateForComparison, downloadICalendar } from '@/lib/utils';
import MatchHero from '@/components/dashboard/MatchHero';
import MatchList from '@/components/dashboard/MatchList';
import HallOfFame from '@/components/dashboard/HallOfFame';

type TabType = 'upcoming' | 'past';

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [slots, setSlots] = useState<SlotPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  useEffect(() => {
    const load = async () => {
      const [mRes, sRes] = await Promise.all([
        supabase.from('matches').select('*').is('deleted_at', null).order('id'),
        supabase.from('slots_public').select('*')
      ]);
      
      if (mRes.data) setMatches(mRes.data);
      if (sRes.data) setSlots(sRes.data);
      setLoading(false);
    };

    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, load)
      .subscribe();

    load();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getOpenCount = (matchId: number) => slots.filter(s => s.match_id === matchId && !s.user_name).length;
  const getTotalSlots = (matchId: number) => slots.filter(s => s.match_id === matchId).length;
  const getProgress = (matchId: number) => {
    const total = getTotalSlots(matchId);
    if (total === 0) return 0;
    const filled = total - getOpenCount(matchId);
    return Math.round((filled / total) * 100);
  };

  // Filtere Spiele basierend auf Tab
  const { upcomingMatches, pastMatches, openCounts } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming: Match[] = [];
    const past: Match[] = [];
    const counts: Record<number, number> = {};
    
    matches.forEach(match => {
      counts[match.id] = getOpenCount(match.id);
      
      const matchDate = getMatchDateForComparison(match.match_date, match.date);
      if (!matchDate) {
        // Falls Datum nicht geparst werden kann, behandle es als zukünftig
        upcoming.push(match);
        return;
      }
      
      const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      
      if (matchDateOnly >= today) {
        upcoming.push(match);
      } else {
        past.push(match);
      }
    });
    
    // Sortiere kommende Spiele aufsteigend (nächstes zuerst)
    upcoming.sort((a, b) => {
      const dateA = getMatchDateForComparison(a.match_date, a.date);
      const dateB = getMatchDateForComparison(b.match_date, b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // Sortiere vergangene Spiele absteigend (neuestes zuerst)
    past.sort((a, b) => {
      const dateA = getMatchDateForComparison(a.match_date, a.date);
      const dateB = getMatchDateForComparison(b.match_date, b.date);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
    
    return { upcomingMatches: upcoming, pastMatches: past, openCounts: counts };
  }, [matches, slots]);

  const displayedMatches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;
  const nextMatch = activeTab === 'upcoming' ? upcomingMatches[0] : null;
  const listMatches = activeTab === 'upcoming' ? upcomingMatches.slice(1) : pastMatches;

  if (loading) return (
    <div className="max-w-md mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="h-8 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
      <div className="h-64 bg-white rounded-3xl shadow-sm animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">Willkommen zurück</p>
            <h1 className="text-xl font-bold text-slate-900">SG Ruwertal 1925 e.V.</h1>
          </div>
          <div className="flex items-center gap-2">
            <NextLink
              href="/login"
              className="h-9 w-9 bg-white/80 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm hover:text-blue-600 hover:border-blue-200 transition-colors"
              aria-label="Admin Login"
            >
              <Lock className="w-4 h-4" />
            </NextLink>
            <NextLink href="/" className="h-10 w-10 flex items-center justify-center rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm" aria-label="Startseite">
              <img src="/logo.svg" alt="SG Ruwertal" className="h-8 w-8 object-contain" />
            </NextLink>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">
        
        {/* TAB SWITCHER + EXPORT */}
        <div className="space-y-3">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={clsx(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                activeTab === 'upcoming'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Calendar className="w-4 h-4" />
              Aktuell
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={clsx(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                activeTab === 'past'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <History className="w-4 h-4" />
              Vergangen
            </button>
          </div>

          {/* EXPORT BUTTON */}
          {displayedMatches.length > 0 && (
            <button
              onClick={() => {
                const matchesToExport = activeTab === 'upcoming' ? upcomingMatches : pastMatches;
                const filename = activeTab === 'upcoming' 
                  ? 'sgr-dienste-aktuelle-spiele.ics'
                  : 'sgr-dienste-vergangene-spiele.ics';
                downloadICalendar(matchesToExport, filename);
              }}
              className="w-full py-3 px-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              {activeTab === 'upcoming' ? 'Aktuelle Spiele exportieren' : 'Vergangene Spiele exportieren'}
            </button>
          )}
        </div>

        {/* HERO SECTION - Nur für kommende Spiele */}
        {nextMatch && activeTab === 'upcoming' && (
          <MatchHero 
            match={nextMatch}
            openCount={openCounts[nextMatch.id] || 0}
            progress={getProgress(nextMatch.id)}
          />
        )}        

        {/* LIST SECTION */}
        <MatchList 
          matches={listMatches}
          openCounts={openCounts}
          isPast={activeTab === 'past'}
          title={activeTab === 'upcoming' ? 'Kommende Spiele' : 'Vergangene Spiele'}
        />

        {/* HALL OF FAME */}
        <HallOfFame slots={slots} />

        {/* FOOTER MIT LOGIN LINK */}
        <footer className="mt-12 mb-6 flex justify-center">
          <NextLink 
            href="/login" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100/50 hover:bg-white text-slate-400 hover:text-blue-600 text-xs font-bold transition-all border border-transparent hover:border-blue-100 shadow-sm hover:shadow-md"
          >
            <Lock className="w-3 h-3" /> Admin Login
          </NextLink>
        </footer>

      </div>
    </main>
  );
}
