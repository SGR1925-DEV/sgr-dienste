'use client'; // Wichtig, da wir Interaktivität haben

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Slot } from '@/types';
import Link from 'next/link';

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // Daten laden
  useEffect(() => {
    fetchData();
    
    // Echtzeit-Updates
    const channel = supabase.channel('public:slots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from('matches').select('*').order('id');
    const { data: s } = await supabase.from('slots').select('*');
    if (m) setMatches(m);
    if (s) setSlots(s);
    setLoading(false);
  }

  // Helper für offene Slots
  const getOpenCount = (matchId: number) => slots.filter(s => s.match_id === matchId && !s.user_name).length;

  if (loading) return <div className="p-10 text-center">Lade Dienste...</div>;

  return (
    <main className="p-4 space-y-4 pb-20 max-w-md mx-auto">
      <div className="flex justify-between items-end mb-2 px-1">
        <h2 className="text-slate-700 font-bold text-lg">Heimspiele (Rasenplatz)</h2>
        <span className="text-xs text-slate-400 mb-1">Saison 24/25</span>
      </div>

      {matches.map((match) => {
        const openCount = getOpenCount(match.id);
        let statusColor = 'bg-blue-600'; // Voll
        if (openCount > 2) statusColor = 'bg-red-600';
        else if (openCount > 0) statusColor = 'bg-amber-400';

        return (
          <Link key={match.id} href={`/match/${match.id}`} className="block">
            <div className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative transition-all hover:shadow-md hover:border-blue-300">
              {/* Ampel-Leiste */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`} />
              
              <div className="p-4 pl-5">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {match.date} • {match.time} Uhr
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm ${
                    openCount === 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {openCount === 0 ? 'Voll besetzt' : `Gesucht: ${openCount}`}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-800 mt-1 truncate">
                  <span className="text-slate-400 font-normal text-sm mr-1">vs.</span>
                  {match.opponent}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </main>
  );
}
