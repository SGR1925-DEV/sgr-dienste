'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Info, XCircle } from 'lucide-react';
import { SlotPublic } from '@/types';
import LiquidContainer from '@/components/ui/LiquidContainer';

interface CancellationModalProps {
  slot: SlotPublic | null;
  inputEmail: string;
  isSubmitting: boolean;
  onClose: () => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}

export default function CancellationModal({
  slot,
  inputEmail,
  isSubmitting,
  onClose,
  onEmailChange,
  onSubmit,
}: CancellationModalProps) {
  if (!slot) return null;

  const normalizedEmail = inputEmail.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

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
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">Austragen beantragen</h3>
              <p className="text-sm text-slate-500 font-medium">
                {slot.category} • {slot.time}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <LiquidContainer className="p-2 rounded-2xl focus-within:ring-2 focus-within:ring-orange-500/20">
              <label className="relative block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-3 pt-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> E-Mail zur Verifizierung *
              </label>
              <input 
                type="email" 
                autoComplete="email"
                placeholder="deine@email.de"
                value={inputEmail}
                onChange={e => onEmailChange(e.target.value)}
                className="relative w-full p-3 bg-transparent border-none outline-none text-lg font-medium text-slate-900 placeholder:text-slate-400"
              />
            </LiquidContainer>

            <div className="flex items-start gap-2 px-1">
              <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-tight">
                Bitte gib die E-Mail an, mit der du dich eingetragen hast. 
                Aus Datenschutzgründen wird die E-Mail nach dem Antrag gelöscht.
              </p>
            </div>

            <button 
              onClick={onSubmit}
              disabled={!isEmailValid || isSubmitting}
              className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isSubmitting ? '...' : 'Austragung beantragen'}
            </button>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
