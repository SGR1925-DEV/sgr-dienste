'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Match, Slot } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Check,
  ChevronRight,
  User, 
  Beer, 
  Utensils, 
  Shield,
  Coins,
  Sparkles,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';

// Hilfsfunktion für Icons
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('theke') || lower.includes('getränke')) return <Beer className="w-4 h-4" />;
  if (lower.includes('grill') || lower.includes('essen')) return <Utensils className="w-4 h-4" />;
  if (lower.includes('ordner') || lower.includes('sicherheit')) return <Shield className="w-4 h-4" />;
  if (lower.includes('kasse')) return <Coins className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
};

// --- CUSTOM COMPONENT: Liquid Glass Container ---
const LiquidContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx(
    "relative overflow-hidden bg-gradient-to-br from-white/60 to-blue-50/30 backdrop-blur-xl border border-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9)] ring-1 ring-blue-500/5 transition-all",
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
    {children}
  </div>
);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (matchData) setMatch(matchData);
      const { data: slotsData } = await supabase.from('slots').select('*').eq('match_id', matchId).order('id');
      if (slotsData) setSlots(slotsData);
      setLoading(false);
    };

    const channel = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots', filter: `match_id=eq.${matchId}` }, () => fetchData())
      .subscribe();

    fetchData();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  const handleSignUp = async () => {
    if (!selectedSlot || inputName.length < 2) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('slots').update({ user_name: inputName }).eq('id', selectedSlot.id);
    if (!error) {
      // Optimistisches Update
      setSlots(current => current.map(s => s.id === selectedSlot.id ? { ...s, user_name: inputName } : s));
      setSelectedSlot(null);
      setInputName('');
    } else {
      alert("Fehler: Konnte nicht speichern. Versuche es erneut.");
    }
    setIsSubmitting(false);
  };

  const categories = Array.from(new Set(slots.map(s => s.category)));

  if (loading) return <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/></div>;
  if (!match) return <div className="p-6">Spiel nicht gefunden.</div>;

  return (
    <main className="min-h-screen bg-[#F2F2F7] pb-32">
      
      {/* 1. HEADER (Transparent & Floating) */}
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.back()} 
          className="pointer-events-auto h-10 w-10 bg-white/70 backdrop-blur-xl shadow-sm border border-white/20 rounded-full flex items-center justify-center text-slate-700 active:scale-90 transition-all hover:bg-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* 2. HERO SECTION */}
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
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> {match.date}
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> {match.time}
          </div>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="max-w-md mx-auto px-4 space-y-8">
        {categories.map((cat, catIndex) => (
          <motion.div 
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            {/* Kategorie Header */}
            <div className="flex items-center gap-2 mb-3 ml-4">
              <div className="text-blue-500">{getCategoryIcon(cat)}</div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat}</h3>
            </div>

            {/* Die "Insel" */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100/50">
              {slots.filter(s => s.category === cat).map((slot, idx) => {
                const isTaken = !!slot.user_name;
                
                return (
                  <div 
                    key={slot.id} 
                    // Nur klickbar wenn NICHT vergeben
                    onClick={() => !isTaken && setSelectedSlot(slot)}
                    className={clsx(
                      "relative p-4 flex items-center justify-between transition-colors",
                      idx !== 0 && "border-t border-slate-50",
                      !isTaken ? "active:bg-blue-50 cursor-pointer hover:bg-slate-50" : "bg-slate-50/50" // Ausgegrauter Hintergrund wenn besetzt
                    )}
                  >
                    {/* Linke Seite: Zeit & Status */}
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-sm border",
                        isTaken 
                          ? "bg-white border-slate-100 text-slate-300" 
                          : "bg-blue-50 border-blue-100 text-blue-600"
                      )}>
                        {slot.time.split(' - ')[0].replace(' Uhr', '')}
                      </div>
                      
                      <div>
                        {isTaken ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{slot.user_name}</span>
                            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Bestätigt
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-600">Freier Dienst</span>
                            <span className="text-[10px] text-slate-400">{slot.time} Uhr</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rechte Seite: Action Icon (Pfeil oder Schloss) */}
                    <div>
                      {isTaken ? (
                        // Kein Button mehr zum Austragen! Nur noch visuelles Feedback.
                        <div className="p-2 text-slate-200">
                          <User className="w-5 h-5 opacity-20" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                          <ChevronRight className="w-5 h-5 ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. MODERN BOTTOM SHEET (Modal) */}
      <AnimatePresence>
        {selectedSlot && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedSlot(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-w-md mx-auto"
            >
              <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  {getCategoryIcon(selectedSlot.category)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Dienst übernehmen</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {selectedSlot.category} • {selectedSlot.time}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                
                <LiquidContainer className="p-2 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20">
                  <label className="relative block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-1">
                    Dein Name
                  </label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Vorname Nachname"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    // Hier die dunklere Textfarbe für bessere Lesbarkeit
                    className="relative w-full p-3 bg-transparent border-none outline-none text-lg font-bold text-slate-900 placeholder:text-slate-400"
                  />
                </LiquidContainer>

                <div className="flex items-start gap-2 px-1">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Mit dem Speichern wird dein Name öffentlich in der Liste angezeigt. 
                    Änderungen sind nur über den Admin möglich.
                  </p>
                </div>

                <button 
                  onClick={handleSignUp}
                  disabled={inputName.length < 2 || isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? '...' : 'Verbindlich eintragen'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}