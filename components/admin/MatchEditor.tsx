'use client';

import { ArrowLeft, Settings, LayoutList, Save, Plus, Trash2, Users, Mail, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ServiceType, Slot } from '@/types';
import { parseDisplayDateToISO, formatDateForDisplay, isoStringToDate } from '@/lib/utils';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';

interface MatchEditorProps {
  editingMatchId: number | null;
  editForm: {
    opponent: string;
    date: string; // ISO format (YYYY-MM-DD) for internal storage
    time: string; // HH:mm format
    location: string;
    team: string;
  };
  editorSlots: Slot[];
  serviceTypes: ServiceType[];
  newSlotConfig: { [key: string]: { count: number; time: string } };
  uniqueCategories: string[];
  onClose: () => void;
  onFormChange: (field: string, value: string) => void;
  onDateChange: (date: Date) => void;
  onSaveMatchMetadata: () => void;
  onAddSlotsToMatch: (category: string) => void;
  onDeleteSlot: (slotId: number, userName: string | null) => void;
  onConfirmCancellation: (slotId: number) => void;
  onRejectCancellation: (slotId: number) => void;
  adminActionSlotId?: number | null;
  adminActionType?: 'confirm' | 'reject' | null;
  onSlotConfigChange: (category: string, field: 'count' | 'time', value: number | string) => void;
}

/**
 * MatchEditor Component
 * Complex form for creating/editing matches and managing service slots
 */
export default function MatchEditor({
  editingMatchId,
  editForm,
  editorSlots,
  serviceTypes,
  newSlotConfig,
  uniqueCategories,
  onClose,
  onFormChange,
  onDateChange,
  onSaveMatchMetadata,
  onAddSlotsToMatch,
  onDeleteSlot,
  onConfirmCancellation,
  onRejectCancellation,
  adminActionSlotId = null,
  adminActionType = null,
  onSlotConfigChange,
}: MatchEditorProps) {
  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      <header className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <button 
          onClick={onClose} 
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Zurück
        </button>
        <span className="font-black text-slate-800 uppercase tracking-widest text-xs">
          {editingMatchId ? 'Bearbeiten' : 'Neu'}
        </span>
        <div className="w-16" />
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* 1. METADATA CARD */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Rahmendaten
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">
                Gegner
              </label>
              <input 
                value={editForm.opponent} 
                onChange={e => onFormChange('opponent', e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 outline-none border border-transparent focus:border-blue-100 focus:bg-blue-50/50 transition-all" 
                placeholder="Gegner" 
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">
                  Datum
                </label>
                <DatePicker
                  value={isoStringToDate(editForm.date)}
                  onChange={onDateChange}
                />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">
                  Zeit
                </label>
                <TimePicker
                  value={editForm.time}
                  onChange={(time) => onFormChange('time', time)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">
                  Ort
                </label>
                <input 
                  value={editForm.location} 
                  onChange={e => onFormChange('location', e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 outline-none border border-transparent focus:border-blue-100 focus:bg-blue-50/50 transition-all" 
                  placeholder="Ort" 
                />
              </div>
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">
                  Mannschaft
                </label>
                <select
                  value={editForm.team}
                  onChange={e => onFormChange('team', e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 outline-none border border-transparent focus:border-blue-100 focus:bg-blue-50/50 transition-all"
                >
                  <option value="1. Mannschaft">1. Mannschaft</option>
                  <option value="2. Mannschaft">2. Mannschaft</option>
                  <option value="3. Mannschaft">3. Mannschaft</option>
                </select>
              </div>
            </div>
            <button 
              onClick={onSaveMatchMetadata}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-transform"
            >
              <Save className="w-4 h-4 inline mr-2" /> Speichern
            </button>
          </div>
        </section>

        {/* 2. SLOT CONFIGURATION */}
        {editingMatchId && (
          <section className="space-y-4">
            <div className="px-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-blue-600" /> Dienste verwalten
              </h2>
            </div>

            {uniqueCategories.map(catName => {
              const typeSlots = editorSlots.filter(s => s.category === catName);
              const config = newSlotConfig[catName] || { count: 1, time: '14:00 - Ende' };

              return (
                <div key={catName} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700">{catName}</span>
                    <span className="text-xs font-bold bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg">
                      {typeSlots.length}
                    </span>
                  </div>

                  {/* Existing Slots */}
                  <div className="divide-y divide-slate-50">
                    {typeSlots.map(slot => {
                      const hasCancellationRequest = slot.cancellation_requested;
                      const isConfirming = adminActionType === 'confirm' && adminActionSlotId === slot.id;
                      const isRejecting = adminActionType === 'reject' && adminActionSlotId === slot.id;
                      const isActionPending = isConfirming || isRejecting;
                      
                      return (
                        <div 
                          key={slot.id} 
                          className={clsx(
                            "p-3 flex items-start justify-between hover:bg-slate-50 transition-colors",
                            hasCancellationRequest && "bg-orange-50/50 border-l-4 border-orange-500"
                          )}
                        >
                          <div className="flex gap-3 flex-1">
                            <div className={clsx(
                              "w-2 h-2 rounded-full mt-1.5",
                              slot.user_name 
                                ? (hasCancellationRequest ? "bg-orange-500" : "bg-emerald-500")
                                : "bg-slate-300"
                            )} />
                            <div className="flex flex-col gap-0.5 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-bold text-slate-900">{slot.time}</div>
                                {hasCancellationRequest && (
                                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                    Austragung angefragt
                                  </span>
                                )}
                              </div>
                              
                              {/* USER INFO & CONTACT */}
                              {slot.user_name ? (
                                <div className={clsx(
                                  "flex flex-col p-1.5 rounded-lg mt-1 border",
                                  hasCancellationRequest
                                    ? "bg-orange-50/50 border-orange-200"
                                    : "bg-emerald-50/50 border-emerald-100"
                                )}>
                                  <span className={clsx(
                                    "text-[11px] font-bold flex items-center gap-1",
                                    hasCancellationRequest ? "text-orange-700" : "text-emerald-700"
                                  )}>
                                    <Users className="w-3 h-3" /> {slot.user_name}
                                  </span>
                                  {slot.user_contact && (
                                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                      <Mail className="w-3 h-3 text-slate-400" /> 
                                      <a 
                                        href={`mailto:${slot.user_contact}`}
                                        className="hover:underline hover:text-blue-600"
                                      >
                                        {slot.user_contact}
                                      </a>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Offen</span>
                              )}
                            </div>
                          </div>
                          {hasCancellationRequest ? (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button 
                                onClick={() => onConfirmCancellation(slot.id)}
                                disabled={isActionPending}
                                className={clsx(
                                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                                  isActionPending
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                                )}
                                title="Austragung bestätigen"
                              >
                                <Check className="w-3.5 h-3.5 inline mr-1" />
                                {isConfirming ? 'Bestätige...' : 'Bestätigen'}
                              </button>
                              <button 
                                onClick={() => onRejectCancellation(slot.id)}
                                disabled={isActionPending}
                                className={clsx(
                                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                                  isActionPending
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 active:scale-95"
                                )}
                                title="Anfrage ablehnen"
                              >
                                <X className="w-3.5 h-3.5 inline mr-1" />
                                {isRejecting ? 'Lehne ab...' : 'Ablehnen'}
                              </button>
                            </div>
                          ) : (
                            slot.user_name && (
                              <button 
                                onClick={() => onDeleteSlot(slot.id, slot.user_name)}
                                className="text-slate-500 active:text-red-500 hover:text-red-500 active:bg-red-50 hover:bg-red-50 p-2 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                                title="Nutzer informieren und austragen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Slots Controls */}
                  <div className="p-3 bg-blue-50/30 border-t border-blue-100 flex gap-2">
                    <select 
                      className="w-16 p-2 bg-white rounded-lg text-xs font-bold text-slate-900 border border-blue-100 outline-none text-center" 
                      value={config.count} 
                      onChange={(e) => onSlotConfigChange(catName, 'count', parseInt(e.target.value))}
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Zeit" 
                      className="flex-1 p-2 bg-white rounded-lg text-xs font-bold text-slate-900 border border-blue-100 outline-none placeholder:text-slate-400" 
                      value={config.time} 
                      onChange={(e) => onSlotConfigChange(catName, 'time', e.target.value)} 
                    />
                    <button 
                      onClick={() => onAddSlotsToMatch(catName)}
                      className="bg-blue-600 text-white p-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
