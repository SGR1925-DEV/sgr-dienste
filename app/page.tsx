'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Slot } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Shield, MapPin, Lock } from 'lucide-react';
import { clsx } from 'clsx';

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [mRes, sRes] = await Promise.all([
        supabase.from('matches').select('*').order('id'),
        supabase.from('slots').select('*')
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

  if (loading) return (
    <div className="max-w-md mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="h-8 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
      <div className="h-64 bg-white rounded-3xl shadow-sm animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />)}
      </div>
    </div>
  );

  const nextMatch = matches[0];
  const upcomingMatches = matches.slice(1);

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">Willkommen zurück</p>
            <h1 className="text-xl font-bold text-slate-900">SG Ruwertal 1925 e.V.</h1>
          </div>
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
            SGR
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">
        
        {/* HERO SECTION */}
        {nextMatch && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold text-slate-800">Als nächstes</h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Heimspiel</span>
            </div>

            <Link href={`/match/${nextMatch.id}`}>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100"
              >
                <div className={clsx(
                  "absolute top-0 left-0 w-full h-2",
                  getOpenCount(nextMatch.id) === 0 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-600 to-indigo-600"
                )} />

                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                       <Calendar className="w-4 h-4 text-blue-500" />
                       {nextMatch.date} • {nextMatch.time}
                    </div>
                    {getOpenCount(nextMatch.id) > 2 && (
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
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                      {nextMatch.opponent}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Sportplatz Kasel
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between text-sm mb-2 font-semibold">
                      <span className="text-slate-600">Dienstplan Status</span>
                      <span className={clsx(
                        getOpenCount(nextMatch.id) === 0 ? "text-emerald-600" : "text-blue-600"
                      )}>
                        {getProgress(nextMatch.id)}% Belegt
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          "h-full transition-all duration-1000 ease-out rounded-full",
                          getOpenCount(nextMatch.id) === 0 ? "bg-emerald-500" : "bg-blue-600"
                        )}
                        style={{ width: `${getProgress(nextMatch.id)}%` }} 
                      />
                    </div>
                    <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                         ))}
                      </div>
                      <span>Noch {getOpenCount(nextMatch.id)} Helfer gesucht</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </section>
        )}

        {/* LIST SECTION */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Kommende Spiele</h2>
          <div className="space-y-3">
            {upcomingMatches.map((match, i) => (
              <Link key={match.id} href={`/match/${match.id}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-xl font-bold leading-none border border-blue-100">
                      <span className="text-[10px] uppercase opacity-60 mb-0.5">{match.date.split('.')[0]}</span>
                      <span className="text-lg">{match.date.split('.')[1]}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg leading-tight">{match.opponent}</h4>
                      <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <span>{match.time} Uhr</span>
                        {getOpenCount(match.id) > 0 && (
                          <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                            {getOpenCount(match.id)} offen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="text-slate-300 w-5 h-5 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </motion.div>
              </Link>
            ))}
            
            {matches.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aktuell keine Spiele geplant.</p>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER MIT LOGIN LINK */}
        <footer className="mt-12 mb-6 flex justify-center">
          <Link 
            href="/login" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100/50 hover:bg-white text-slate-400 hover:text-blue-600 text-xs font-bold transition-all border border-transparent hover:border-blue-100 shadow-sm hover:shadow-md"
          >
            <Lock className="w-3 h-3" /> Admin Login
          </Link>
        </footer>

      </div>
    </main>
  );
}