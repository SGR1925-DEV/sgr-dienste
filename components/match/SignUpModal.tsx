'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Info, Beer, Utensils, Shield, Coins, Sparkles } from 'lucide-react';
import { Slot } from '@/types';
import LiquidContainer from '@/components/ui/LiquidContainer';

// Icons für Kategorien (dupliziert von SlotList, könnte später in utils verschoben werden)
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('theke') || lower.includes('getränke')) return <Beer className="w-4 h-4" />;
  if (lower.includes('grill') || lower.includes('essen')) return <Utensils className="w-4 h-4" />;
  if (lower.includes('ordner') || lower.includes('sicherheit')) return <Shield className="w-4 h-4" />;
  if (lower.includes('kasse')) return <Coins className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
};

interface SignUpModalProps {
  slot: Slot | null;
  inputName: string;
  inputContact: string;
  isSubmitting: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * SignUpModal Component
 * Bottom sheet modal for signing up for a service slot
 */
export default function SignUpModal({
  slot,
  inputName,
  inputContact,
  isSubmitting,
  onClose,
  onNameChange,
  onContactChange,
  onSubmit,
}: SignUpModalProps) {
  if (!slot) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
        />
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-w-md mx-auto"
        >
          <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              {getCategoryIcon(slot.category)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">Dienst übernehmen</h3>
              <p className="text-sm text-slate-500 font-medium">
                {slot.category} • {slot.time}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <LiquidContainer className="p-2 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20">
              <label className="relative block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-1">
                Dein Name *
              </label>
              <input 
                type="text" 
                autoFocus
                placeholder="Vorname Nachname"
                value={inputName}
                onChange={(e) => onNameChange(e.target.value)}
                className="relative w-full p-3 bg-transparent border-none outline-none text-lg font-bold text-slate-900 placeholder:text-slate-400"
              />
            </LiquidContainer>

            {/* Kontakt Input (Optional) */}
            <LiquidContainer className="p-2 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20">
              <label className="relative block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefon / E-Mail (Optional)
              </label>
              <input 
                type="text" 
                placeholder="Für Rückfragen (privat)"
                value={inputContact}
                onChange={(e) => onContactChange(e.target.value)}
                className="relative w-full p-3 bg-transparent border-none outline-none text-lg font-medium text-slate-900 placeholder:text-slate-400"
              />
            </LiquidContainer>

            <div className="flex items-start gap-2 px-1">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-tight">
                Dein Name ist öffentlich in der Liste sichtbar. Deine Telefonnummer/E-Mail sieht nur der Admin. 
                Die Eintragung ist verbindlich.
              </p>
            </div>

            <button 
              onClick={onSubmit}
              disabled={inputName.length < 2 || isSubmitting}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isSubmitting ? '...' : 'Verbindlich eintragen'}
            </button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
