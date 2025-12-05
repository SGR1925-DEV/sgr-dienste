'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Match, ServiceType, Slot } from '@/types';
import { 
  LogOut, 
  Plus, 
  Trash2, 
  Calendar, 
  Settings, 
  LayoutList,
  X,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

// --- HELPER: Datum formatieren ---
// Input Date liefert "YYYY-MM-DD", wir wollen "So. 14.12."
const formatDateForDisplay = (isoDate: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('de-DE', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  }) + '.';
};

// --- HELPER: Datum für Input ---
// DB liefert "So. 14.12.", wir brauchen "YYYY-MM-DD" für den Datepicker
// Da wir das Datum als Text speichern ("So. 14.12."), ist ein echtes Reverse-Parsing schwer.
// TRICK: Wir speichern ab jetzt beim "Edit" auch das ISO-Datum in einem unsichtbaren State oder 
// wir verlassen uns darauf, dass der Admin es neu setzt, wenn er es ändern will.
// FÜR DIE ZUKUNFT: Es wäre besser, 'date' in der DB als 'DATE' Typ zu haben.
// Hier arbeiten wir mit einem Workaround für die UI.

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'settings'>('matches');
  
  // Data
  const [matches, setMatches] = useState<Match[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // EDITOR STATE
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null); // null = New Match
  
  // Editor Form Data
  const [editForm, setEditForm] = useState({
    opponent: '',
    date: '', // YYYY-MM-DD
    time: '14:30',
    location: 'Sportplatz Kasel'
  });
  
  // Editor Slot Management
  const [editorSlots, setEditorSlots] = useState<Slot[]>([]); // Aktuelle Slots des Spiels
  
  // Temporary State für "Slot hinzufügen" innerhalb des Editors
  const [newSlotConfig, setNewSlotConfig] = useState<{ [key: string]: { count: number, time: string } }>({});

  // 1. Init
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await loadData();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadData = async () => {
    const [mRes, sRes] = await Promise.all([
      supabase.from('matches').select('*').order('id', { ascending: false }),
      supabase.from('service_types').select('*').order('id')
    ]);
    if (mRes.data) setMatches(mRes.data);
    if (sRes.data) setServiceTypes(sRes.data);
  };

  // --- EDITOR LOGIC ---

  const openEditor = async (match?: Match) => {
    if (match) {
      // Edit Mode
      setEditingMatchId(match.id);
      
      // Versuche das Datum für den Picker zu rekonstruieren (oder leer lassen)
      // Ideal wäre DB Umstellung auf DATE type. Hier lassen wir es leer, Admin muss neu wählen wenn Änderung.
      setEditForm({
        opponent: match.opponent,
        date: '', 
        time: match.time,
        location: match.location || 'Sportplatz Kasel'
      });

      // Lade Slots für dieses Spiel
      const { data } = await supabase.from('slots').select('*').eq('match_id', match.id).order('id');
      if (data) setEditorSlots(data);

    } else {
      // Create Mode
      setEditingMatchId(null);
      setEditForm({ opponent: '', date: '', time: '14:30', location: 'Sportplatz Kasel' });
      setEditorSlots([]);
    }
    
    // Reset Slot Configs
    const initialConfig: any = {};
    serviceTypes.forEach(t => {
      initialConfig[t.name] = { count: t.default_count || 1, time: '14:00 - Ende' }; // Default
    });
    setNewSlotConfig(initialConfig);

    setIsEditorOpen(true);
  };

  const saveMatchMetadata = async () => {
    if (!editForm.opponent) return alert("Gegner fehlt");
    
    const formattedDate = editForm.date ? formatDateForDisplay(editForm.date) : null;
    
    const payload: any = {
      opponent: editForm.opponent,
      time: editForm.time,
      location: editForm.location
    };
    // Nur Datum updaten wenn ausgewählt (da wir "So. 12.03." nicht zurück in "2023-03-12" parsen können ohne Jahr)
    if (formattedDate) payload.date = formattedDate;

    let matchId = editingMatchId;

    if (matchId) {
      // UPDATE
      await supabase.from('matches').update(payload).eq('id', matchId);
    } else {
      // CREATE
      if(!formattedDate) return alert("Datum fehlt!"); // Bei neuem Spiel Pflicht
      payload.date = formattedDate; // Sicherstellen dass Datum da ist
      
      const { data, error } = await supabase.from('matches').insert([payload]).select().single();
      if (error || !data) return alert("Fehler beim Erstellen");
      matchId = data.id;
      setEditingMatchId(matchId); // Switch to Edit Mode immediately
    }

    await loadData(); // Refresh List
    // Wir schließen den Editor NICHT, damit man direkt Slots bearbeiten kann
    alert("Grunddaten gespeichert. Du kannst jetzt Dienste hinzufügen.");
  };

  const addSlotsToMatch = async (category: string) => {
    if (!editingMatchId) return alert("Bitte erst das Spiel speichern!");
    
    const config = newSlotConfig[category];
    if (!config) return;

    const slotsToInsert = [];
    for (let i = 0; i < config.count; i++) {
      slotsToInsert.push({
        match_id: editingMatchId,
        category: category,
        time: config.time,
        user_name: null
      });
    }

    await supabase.from('slots').insert(slotsToInsert);
    
    // Refresh Slots im Editor
    const { data } = await supabase.from('slots').select('*').eq('match_id', editingMatchId).order('id');
    if (data) setEditorSlots(data);
  };

  const deleteSlot = async (slotId: number, userName: string | null) => {
    if (userName && !confirm(`Achtung: ${userName} ist hier eingetragen. Wirklich löschen?`)) return;
    await supabase.from('slots').delete().eq('id', slotId);
    // Refresh local state
    setEditorSlots(current => current.filter(s => s.id !== slotId));
  };

  // --- GENERAL ACTIONS ---

  const deleteMatch = async (id: number) => {
    if(!confirm("Spiel wirklich löschen?")) return;
    await supabase.from('matches').delete().eq('id', id);
    loadData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- SETTINGS ACTIONS ---
  const [newServiceInput, setNewServiceInput] = useState('');
  const addServiceType = async () => {
    if(!newServiceInput) return;
    await supabase.from('service_types').insert([{ name: newServiceInput, default_count: 1 }]);
    setNewServiceInput('');
    loadData();
  };
  const deleteServiceType = async (id: number) => {
    if(confirm("Kategorie löschen?")) {
      await supabase.from('service_types').delete().eq('id', id);
      loadData();
    }
  };


  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Lade...</div>;

  // --- RENDER: EDITOR VIEW ---
  if (isEditorOpen) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] pb-24">
        {/* Editor Header */}
        <header className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <button onClick={() => setIsEditorOpen(false)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold text-sm">
            <ArrowLeft className="w-5 h-5" /> Zurück
          </button>
          <span className="font-black text-slate-800 uppercase tracking-widest text-xs">
            {editingMatchId ? 'Spiel bearbeiten' : 'Neues Spiel'}
          </span>
          <div className="w-16" /> {/* Spacer */}
        </header>

        <div className="max-w-md mx-auto p-4 space-y-6">
          
          {/* 1. METADATA CARD */}
          <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Rahmendaten
            </h2>
            
            <div className="space-y-4">
              {/* Gegner */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Gegner</label>
                <div className="flex items-center bg-slate-50 rounded-xl px-3 border border-transparent focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                  <Users className="w-4 h-4 text-slate-400 mr-2" />
                  <input 
                    value={editForm.opponent}
                    onChange={e => setEditForm({...editForm, opponent: e.target.value})}
                    placeholder="z.B. SV Gutweiler" 
                    className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Datum & Zeit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Datum</label>
                  <div className="bg-slate-50 rounded-xl px-3 border border-transparent focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <input 
                      type="date"
                      value={editForm.date}
                      onChange={e => setEditForm({...editForm, date: e.target.value})}
                      className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Anstoß</label>
                  <div className="bg-slate-50 rounded-xl px-3 border border-transparent focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <input 
                      type="time"
                      value={editForm.time}
                      onChange={e => setEditForm({...editForm, time: e.target.value})}
                      className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Ort */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mb-1 block">Spielort</label>
                <div className="flex items-center bg-slate-50 rounded-xl px-3 border border-transparent focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                  <input 
                    value={editForm.location}
                    onChange={e => setEditForm({...editForm, location: e.target.value})}
                    placeholder="Ort" 
                    className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={saveMatchMetadata}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-transform"
              >
                <Save className="w-4 h-4" /> {editingMatchId ? 'Änderungen speichern' : 'Spiel anlegen'}
              </button>
            </div>
          </section>

          {/* 2. SLOT CONFIGURATION (Only visible if match exists) */}
          {editingMatchId && (
            <section className="space-y-4">
              <div className="px-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-blue-600" /> Dienste planen
                </h2>
                <p className="text-xs text-slate-400 mt-1">Hier legst du fest, wie viele Helfer pro Bereich benötigt werden.</p>
              </div>

              {serviceTypes.map(type => {
                const typeSlots = editorSlots.filter(s => s.category === type.name);
                const config = newSlotConfig[type.name] || { count: 1, time: '' };

                return (
                  <div key={type.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-bold text-slate-700">{type.name}</span>
                      <span className="text-xs font-bold bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg">
                        {typeSlots.length} Slots aktiv
                      </span>
                    </div>

                    {/* Existing Slots List */}
                    <div className="divide-y divide-slate-50">
                      {typeSlots.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-300 italic">Noch keine Dienste eingetragen.</div>
                      )}
                      {typeSlots.map(slot => (
                        <div key={slot.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={clsx("w-2 h-2 rounded-full", slot.user_name ? "bg-emerald-500" : "bg-slate-300")} />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{slot.time}</div>
                              {slot.user_name && <div className="text-[10px] text-emerald-600 font-bold">{slot.user_name}</div>}
                            </div>
                          </div>
                          <button onClick={() => deleteSlot(slot.id, slot.user_name)} className="text-slate-300 hover:text-red-500 p-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Slots Area */}
                    <div className="p-3 bg-blue-50/30 border-t border-blue-100">
                      <div className="flex gap-2 items-center">
                        <div className="w-16">
                          <select 
                            className="w-full p-2 bg-white rounded-lg text-xs font-bold border border-blue-100 outline-none text-center text-slate-900"
                            value={config.count}
                            onChange={(e) => setNewSlotConfig({...newSlotConfig, [type.name]: { ...config, count: parseInt(e.target.value) }})}
                          >
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}x</option>)}
                          </select>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Zeit (z.B. 14:00 - 16:00)"
                          className="flex-1 p-2 bg-white rounded-lg text-xs font-bold border border-blue-100 outline-none text-slate-900 placeholder:text-slate-400"
                          value={config.time}
                          onChange={(e) => setNewSlotConfig({...newSlotConfig, [type.name]: { ...config, time: e.target.value }})}
                        />
                        <button 
                          onClick={() => addSlotsToMatch(type.name)}
                          disabled={!config.time}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
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

  // --- RENDER: DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      
      {/* Dashboard Header */}
      <header className="bg-slate-900 text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-xl shadow-slate-900/20 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black">Admin Cockpit</h1>
            <p className="text-slate-400 text-sm">Verwaltung & Planung</p>
          </div>
          <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('matches')}
            className={clsx("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", 
              activeTab === 'matches' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Calendar className="w-4 h-4" /> Spiele
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={clsx("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", 
              activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" /> Kategorien
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 space-y-8">
        
        {/* TAB 1: MATCH MANAGEMENT */}
        {activeTab === 'matches' && (
          <>
            <button 
              onClick={() => openEditor()} // Create New
              className="w-full py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center gap-2 text-blue-600 font-bold active:scale-[0.98] transition-all"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              Neues Spiel anlegen
            </button>

            <div className="space-y-3 pb-10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2 mt-4">Aktive Spiele</h3>
              {matches.map(match => (
                <div 
                  key={match.id} 
                  onClick={() => openEditor(match)} // Edit Existing
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center active:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{match.opponent}</div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {match.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {match.time}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-300">
                    <Settings className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: SETTINGS */}
        {activeTab === 'settings' && (
          <>
             <div className="flex gap-2 mb-6">
               <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center px-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                 <LayoutList className="w-5 h-5 text-slate-400 mr-3" />
                 <input 
                   value={newServiceInput}
                   onChange={e => setNewServiceInput(e.target.value)}
                   placeholder="Neue Kategorie..." 
                   className="w-full py-4 bg-transparent text-sm font-bold text-slate-900 outline-none"
                 />
               </div>
               <button 
                 onClick={addServiceType}
                 className="bg-slate-900 text-white px-5 rounded-2xl font-bold shadow-lg shadow-slate-900/10"
               >
                 <Plus className="w-6 h-6" />
               </button>
             </div>

             <div className="space-y-2">
                {serviceTypes.map(type => (
                  <div key={type.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">{type.name}</span>
                    <button onClick={() => deleteServiceType(type.id)} className="text-slate-300 hover:text-red-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
             </div>
          </>
        )}

      </div>
    </div>
  );
}