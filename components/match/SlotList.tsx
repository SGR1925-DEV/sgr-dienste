'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, User, Beer, Utensils, Shield, Coins, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { Slot } from '@/types';

// Icons für Kategorien
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('theke') || lower.includes('getränke')) return <Beer className="w-4 h-4" />;
  if (lower.includes('grill') || lower.includes('essen')) return <Utensils className="w-4 h-4" />;
  if (lower.includes('ordner') || lower.includes('sicherheit')) return <Shield className="w-4 h-4" />;
  if (lower.includes('kasse')) return <Coins className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
};

interface SlotListProps {
  slots: Slot[];
  onSlotClick: (slot: Slot) => void;
}

/**
 * SlotList Component
 * Displays service slots grouped by category
 */
export default function SlotList({ slots, onSlotClick }: SlotListProps) {
  const categories = Array.from(new Set(slots.map(s => s.category)));

  return (
    <div className="max-w-md mx-auto px-4 space-y-8">
      {categories.map((cat, catIndex) => (
        <motion.div 
          key={cat}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIndex * 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3 ml-4">
            <div className="text-blue-500">{getCategoryIcon(cat)}</div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat}</h3>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100/50">
            {slots.filter(s => s.category === cat).map((slot, idx) => {
              const isTaken = !!slot.user_name;
              
              return (
                <div 
                  key={slot.id} 
                  onClick={() => !isTaken && onSlotClick(slot)}
                  className={clsx(
                    "relative p-4 flex items-center justify-between transition-colors",
                    idx !== 0 && "border-t border-slate-50",
                    !isTaken ? "active:bg-blue-50 cursor-pointer hover:bg-slate-50" : "bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-sm border",
                      isTaken ? "bg-white border-slate-100 text-slate-300" : "bg-blue-50 border-blue-100 text-blue-600"
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

                  <div>
                    {isTaken ? (
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
  );
}
