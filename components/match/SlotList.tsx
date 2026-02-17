'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, User, Beer, Utensils, Shield, Coins, Sparkles, XCircle } from 'lucide-react';
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
  onRequestCancellation?: (slot: Slot) => void;
}

/**
 * SlotList Component
 * Displays service slots grouped by category
 */
export default function SlotList({ slots, onSlotClick, onRequestCancellation }: SlotListProps) {
  const categories = Array.from(new Set(slots.map(s => s.category).filter(Boolean)));

  if (slots.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium">Noch keine Dienste für dieses Spiel.</p>
          <p className="text-sm text-slate-400 mt-1">Im Admin-Bereich können Dienste angelegt werden.</p>
        </div>
      </div>
    );
  }

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
              const hasCancellationRequest = !!slot.cancellation_requested;
              const timeLabel = slot.time ? String(slot.time).split(' - ')[0]?.replace(' Uhr', '') ?? '–' : '–';
              
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
                  <div className="flex items-center gap-4 flex-1">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-sm border",
                      isTaken ? "bg-white border-slate-100 text-slate-300" : "bg-blue-50 border-blue-100 text-blue-600"
                    )}>
                      {timeLabel}
                    </div>
                    
                    <div className="flex-1">
                      {isTaken ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900">{slot.user_name}</span>
                          {hasCancellationRequest ? (
                            <span className="text-[10px] font-medium text-orange-600 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Stornierung angefragt
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Bestätigt
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">Freier Dienst</span>
                          <span className="text-[10px] text-slate-400">{slot.time ? `${slot.time} Uhr` : '–'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTaken && onRequestCancellation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasCancellationRequest) {
                            onRequestCancellation(slot);
                          }
                        }}
                        disabled={hasCancellationRequest}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          hasCancellationRequest
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95"
                        )}
                      >
                        {hasCancellationRequest ? 'Angefragt' : 'Absage beantragen'}
                      </button>
                    )}
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
