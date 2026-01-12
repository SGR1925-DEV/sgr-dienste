'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Match, Slot } from '@/types';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';
import SlotList from '@/components/match/SlotList';
import SignUpModal from '@/components/match/SignUpModal';

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);

  const [match, setMatch] = useState<Match | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputContact, setInputContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (matchData) setMatch(matchData);
      
      const { data: slotsData } = await supabase.from('slots').select('*').eq('match_id', matchId).order('id');
      if (slotsData) setSlots(slotsData);
      
      setLoading(false);
    };

    // Echtzeit-Updates
    const channel = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots', filter: `match_id=eq.${matchId}` }, () => fetchData())
      .subscribe();

    fetchData();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  const handleSignUp = async () => {
    if (!selectedSlot || inputName.length < 2) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('slots')
      .update({ 
        user_name: inputName,
        user_contact: inputContact || null
      })
      .eq('id', selectedSlot.id);

    if (!error) {
      // Optimistisches Update der UI
      setSlots(current => current.map(s => s.id === selectedSlot.id ? { ...s, user_name: inputName, user_contact: inputContact || null } : s));
      setSelectedSlot(null);
      setInputName('');
      setInputContact('');
    } else {
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    }
    setIsSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
    </div>
  );
  
  if (!match) return <div className="p-6">Spiel nicht gefunden.</div>;

  return (
    <main className="min-h-screen bg-[#F2F2F7] pb-32">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 pointer-events-none">
        <button 
          onClick={() => router.back()} 
          className="pointer-events-auto h-10 w-10 bg-white/70 backdrop-blur-xl shadow-sm border border-white/20 rounded-full flex items-center justify-center text-slate-700 active:scale-90 transition-all hover:bg-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Hero Section */}
      <div className="pt-24 px-6 pb-10 flex flex-col items-center text-center">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-blue-900/10 flex items-center justify-center text-4xl mb-6 border border-white/50"
        >
          ⚽️
        </motion.div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
          <span className="text-slate-400 text-lg font-bold block mb-1">Heimspiel vs.</span>
          {match.opponent}
        </h1>

        <div className="mt-4 flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> {formatDisplayDate(match.date)}
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> {match.time}
          </div>
        </div>
      </div>

      {/* Slots Liste */}
      <SlotList slots={slots} onSlotClick={setSelectedSlot} />

      {/* Eintragen Modal */}
      <SignUpModal
        slot={selectedSlot}
        inputName={inputName}
        inputContact={inputContact}
        isSubmitting={isSubmitting}
        onClose={() => setSelectedSlot(null)}
        onNameChange={setInputName}
        onContactChange={setInputContact}
        onSubmit={handleSignUp}
      />
    </main>
  );
}
