'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Um die ID aus der URL zu holen
import { supabase } from '@/lib/supabase';
import { Match, Slot } from '@/types';

export default function MatchDetail() {
  const params = useParams();
  const matchId = Number(params.id);
  
  const [match, setMatch] = useState<Match | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  
  // Modal State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    // Lade spezifisches Match und Slots
    const load = async () => {
        const { data: m } = await supabase.from('matches').select('*').eq('id', matchId).single();
        const { data: s } = await supabase.from('slots').select('*').eq('match_id', matchId);
        setMatch(m);
        if(s) setSlots(s);
    };
    load();
    
    // Realtime Subscription hier analog zum Dashboard einfügen...
  }, [matchId]);

  const handleSave = async () => {
     if(!selectedSlot || !inputName) return;
     await supabase.from('slots').update({ user_name: inputName }).eq('id', selectedSlot.id);
     setSelectedSlot(null);
     // Reload data...
  };

  if (!match) return <div>Lade Spiel...</div>;

  return (
    <div className="max-w-md mx-auto pb-24">
       {/* Header, Listen und Modal hier einfügen... */}
       <h1 className="text-xl font-bold p-4">vs. {match.opponent}</h1>
       {/* ... Rest der UI analog zur HTML Version ... */}
    </div>
  );
}