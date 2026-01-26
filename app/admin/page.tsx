'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Match, ServiceType, Slot, ServiceTypeMember } from '@/types';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { parseDisplayDateToISO, formatDateForDisplay, formatDisplayDate, dateToISOString, parseMatchDate } from '@/lib/utils';
import AdminHeader from '@/components/admin/AdminHeader';
import MatchEditor from '@/components/admin/MatchEditor';
import ServiceTypeManager from '@/components/admin/ServiceTypeManager';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AlertDialog from '@/components/ui/AlertDialog';
import { adminConfirmCancellation, adminRejectCancellation, adminRemoveUser } from '@/app/actions';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'settings'>('upcoming');
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypeMembers, setServiceTypeMembers] = useState<ServiceTypeMember[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]); 

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null); 
  const [editForm, setEditForm] = useState({ opponent: '', date: '', time: '14:30', location: 'Sportplatz Kasel', team: '1. Mannschaft' });
  const [editorSlots, setEditorSlots] = useState<Slot[]>([]); 
  const [newSlotConfig, setNewSlotConfig] = useState<{ [key: string]: { count: number, time: string } }>({});
  const [adminAction, setAdminAction] = useState<{ slotId: number | null; type: 'confirm' | 'reject' | null }>({
    slotId: null,
    type: null,
  });

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default',
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      await loadData();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadData = async () => {
    const [mRes, sRes, membersRes, slotsRes] = await Promise.all([
      supabase.from('matches').select('*').order('id', { ascending: false }),
      supabase.from('service_types').select('*').order('id'),
      supabase.from('service_type_members').select('*').order('order', { ascending: true }),
      supabase.from('slots').select('*')
    ]);
    if (mRes.data) setMatches(mRes.data);
    if (sRes.data) setServiceTypes(sRes.data);
    if (membersRes.data) setServiceTypeMembers(membersRes.data);
    if (slotsRes.data) setAllSlots(slotsRes.data);
  };

  // Helper für Statistik in der Liste
  const getMatchStats = (matchId: number) => {
    const matchSlots = allSlots.filter(s => s.match_id === matchId);
    const total = matchSlots.length;
    const filled = matchSlots.filter(s => s.user_contact || s.user_name).length;
    const open = total - filled;
    return { total, filled, open };
  };

  // Filtere Spiele basierend auf Datum
  const { upcomingMatches, pastMatches } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming: Match[] = [];
    const past: Match[] = [];
    
    matches.forEach(match => {
      const matchDate = parseMatchDate(match.date);
      if (!matchDate) {
        // Falls Datum nicht geparst werden kann, behandle es als zukünftig
        upcoming.push(match);
        return;
      }
      
      const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      
      if (matchDateOnly >= today) {
        upcoming.push(match);
      } else {
        past.push(match);
      }
    });
    
    // Sortiere kommende Spiele aufsteigend (nächstes zuerst)
    upcoming.sort((a, b) => {
      const dateA = parseMatchDate(a.date);
      const dateB = parseMatchDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // Sortiere vergangene Spiele absteigend (neuestes zuerst)
    past.sort((a, b) => {
      const dateA = parseMatchDate(a.date);
      const dateB = parseMatchDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
    
    return { upcomingMatches: upcoming, pastMatches: past };
  }, [matches]);

  const openEditor = async (match?: Match) => {
    if (match) {
      setEditingMatchId(match.id);
      const isoDate = parseDisplayDateToISO(match.date);
      
      setEditForm({ 
        opponent: match.opponent, 
        date: isoDate || '', 
        time: match.time, 
        location: match.location || 'Sportplatz Kasel',
        team: match.team || '1. Mannschaft'
      });
      
      const { data } = await supabase.from('slots').select('*').eq('match_id', match.id).order('id');
      if (data) setEditorSlots(data);
    } else {
      setEditingMatchId(null);
      const today = new Date().toISOString().split('T')[0];
      setEditForm({ opponent: '', date: today, time: '14:30', location: 'Sportplatz Kasel', team: '1. Mannschaft' });
      setEditorSlots([]);
    }
    
    // Config Reset
    const initialConfig: any = {};
    serviceTypes.forEach(t => { initialConfig[t.name] = { count: t.default_count || 1, time: '14:00 - Ende' }; });
    setNewSlotConfig(initialConfig);
    
    setIsEditorOpen(true);
  };

  const reloadEditorSlots = async () => {
    if (!editingMatchId) return;
    const { data } = await supabase.from('slots').select('*').eq('match_id', editingMatchId).order('id');
    if (data) setEditorSlots(data);
  };

  const saveMatchMetadata = async () => {
    if (!editForm.opponent) {
      setAlertDialog({
        isOpen: true,
        title: 'Fehler',
        message: 'Gegner fehlt',
        variant: 'error',
      });
      return;
    }
    
    // editForm.date ist bereits im ISO-Format (YYYY-MM-DD) vom date-Input
    const formattedDate = editForm.date ? formatDateForDisplay(editForm.date) : null;
    if(!formattedDate) {
      setAlertDialog({
        isOpen: true,
        title: 'Fehler',
        message: 'Bitte Datum wählen',
        variant: 'error',
      });
      return;
    }

    const payload = { 
        opponent: editForm.opponent, 
        date: formattedDate,
        time: editForm.time, 
        location: editForm.location,
        team: editForm.team
    };

    let matchId = editingMatchId;
    
    if (matchId) {
      await supabase.from('matches').update(payload).eq('id', matchId);
    } else {
      const { data, error } = await supabase.from('matches').insert([payload]).select().single();
      if (error || !data) {
        setAlertDialog({
          isOpen: true,
          title: 'Fehler',
          message: 'Fehler beim Speichern',
          variant: 'error',
        });
        return;
      }
      matchId = data.id;
      setEditingMatchId(matchId);
    }
    await loadData();
    setAlertDialog({
      isOpen: true,
      title: 'Erfolg',
      message: 'Daten gespeichert.',
      variant: 'success',
    });
  };

  const addSlotsToMatch = async (category: string) => {
    if (!editingMatchId) {
      setAlertDialog({
        isOpen: true,
        title: 'Hinweis',
        message: 'Bitte erst die Rahmendaten speichern!',
        variant: 'info',
      });
      return;
    }
    
    const config = newSlotConfig[category];
    const count = config?.count || 1;
    const time = config?.time || '14:00 - Ende';

    // Erstelle unabhängige Objekte für jeden Slot (statt Array.fill mit gleicher Referenz)
    const slotsToInsert = Array.from({ length: count }, () => ({ 
        match_id: editingMatchId, 
        category: category, 
        time: time, 
        user_name: null 
    }));
    
    await supabase.from('slots').insert(slotsToInsert);
    
    const { data } = await supabase.from('slots').select('*').eq('match_id', editingMatchId).order('id');
    if (data) {
        setEditorSlots(data);
        loadData();
    }
  };

  const deleteSlot = async (slotId: number, userName: string | null) => {
    // If slot has a user, use adminRemoveUser (which sends email)
    if (userName) {
      setConfirmDialog({
        isOpen: true,
        title: 'Nutzer austragen',
        message: `Nutzer informieren und austragen?\n\n${userName} wird per E-Mail benachrichtigt.`,
        variant: 'danger',
        onConfirm: async () => {
          const result = await adminRemoveUser(slotId);
          if (result.success) {
            // Reload slots for this match
            await reloadEditorSlots();
            await loadData();
            setAlertDialog({
              isOpen: true,
              title: 'Erfolg',
              message: 'Nutzer wurde ausgetragen und per E-Mail benachrichtigt.',
              variant: 'success',
            });
          } else {
            setAlertDialog({
              isOpen: true,
              title: 'Fehler',
              message: result.error || 'Fehler beim Austragen des Nutzers.',
              variant: 'error',
            });
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      // Empty slot: just delete it
      setConfirmDialog({
        isOpen: true,
        title: 'Slot löschen',
        message: 'Diesen leeren Slot wirklich entfernen?',
        variant: 'danger',
        onConfirm: async () => {
          await supabase.from('slots').delete().eq('id', slotId);
          setEditorSlots(current => current.filter(s => s.id !== slotId));
          await loadData();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    }
  };

  const handleConfirmCancellation = async (slotId: number) => {
    if (adminAction.type) return;
    setAdminAction({ slotId, type: 'confirm' });

    const result = await adminConfirmCancellation(slotId);
    if (result.success) {
      await reloadEditorSlots();
      await loadData();
      setAlertDialog({
        isOpen: true,
        title: 'Austragung bestätigt',
        message: 'Der Slot ist jetzt wieder frei.',
        variant: 'success',
      });
    } else {
      setAlertDialog({
        isOpen: true,
        title: 'Fehler',
        message: result.error || 'Fehler beim Bestätigen der Austragung.',
        variant: 'error',
      });
    }

    setAdminAction({ slotId: null, type: null });
  };

  const handleRejectCancellation = async (slotId: number) => {
    if (adminAction.type) return;
    setAdminAction({ slotId, type: 'reject' });

    const result = await adminRejectCancellation(slotId);
    if (result.success) {
      await reloadEditorSlots();
      await loadData();
      setAlertDialog({
        isOpen: true,
        title: 'Anfrage abgelehnt',
        message: 'Die Austragungsanfrage wurde zurückgesetzt.',
        variant: 'success',
      });
    } else {
      setAlertDialog({
        isOpen: true,
        title: 'Fehler',
        message: result.error || 'Fehler beim Ablehnen der Anfrage.',
        variant: 'error',
      });
    }

    setAdminAction({ slotId: null, type: null });
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date) => {
    const isoString = dateToISOString(date);
    setEditForm(prev => ({ ...prev, date: isoString }));
  };

  const handleSlotConfigChange = (category: string, field: 'count' | 'time', value: number | string) => {
    setNewSlotConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Settings Actions
  const [newServiceInput, setNewServiceInput] = useState('');
  const addServiceType = async () => {
    if(!newServiceInput) return;
    await supabase.from('service_types').insert([{ name: newServiceInput, default_count: 1 }]);
    setNewServiceInput('');
    loadData();
  };
  const deleteServiceType = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kategorie löschen',
      message: 'Kategorie-Vorlage löschen?\n(Bestehende Dienste bleiben erhalten)',
      variant: 'danger',
      onConfirm: async () => {
        await supabase.from('service_types').delete().eq('id', id);
        loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };
  const addServiceTypeMember = async (serviceTypeId: number, name: string) => {
    if (!name.trim()) return;
    await supabase.from('service_type_members').insert([{ 
      service_type_id: serviceTypeId, 
      name: name.trim(),
      order: 0
    }]);
    loadData();
  };
  const deleteServiceTypeMember = async (memberId: number) => {
    await supabase.from('service_type_members').delete().eq('id', memberId);
    loadData();
  };

  const deleteMatch = async (id: number, opponent: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Verhindert, dass der Click-Event weitergegeben wird
    
    setConfirmDialog({
      isOpen: true,
      title: 'Spiel löschen',
      message: `Spiel "${opponent}" und ALLE zugehörigen Dienste wirklich löschen?`,
      variant: 'danger',
      onConfirm: async () => {
        // Zuerst alle Slots löschen (wegen Foreign Key Constraint)
        await supabase.from('slots').delete().eq('match_id', id);
        // Dann das Match löschen
        await supabase.from('matches').delete().eq('id', id);
        await loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Kombiniere alle Kategorien
  const uniqueCategories = Array.from(new Set([
    ...serviceTypes.map(t => t.name),
    ...editorSlots.map(s => s.category)
  ]));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">Lade...</div>;

  return (
    <>
      {isEditorOpen ? (
        <MatchEditor
          editingMatchId={editingMatchId}
          editForm={editForm}
          editorSlots={editorSlots}
          serviceTypes={serviceTypes}
          newSlotConfig={newSlotConfig}
          uniqueCategories={uniqueCategories}
          onClose={() => setIsEditorOpen(false)}
          onFormChange={handleFormChange}
          onDateChange={handleDateChange}
          onSaveMatchMetadata={saveMatchMetadata}
          onAddSlotsToMatch={addSlotsToMatch}
          onDeleteSlot={deleteSlot}
          onConfirmCancellation={handleConfirmCancellation}
          onRejectCancellation={handleRejectCancellation}
          adminActionSlotId={adminAction.slotId}
          adminActionType={adminAction.type}
          onSlotConfigChange={handleSlotConfigChange}
        />
      ) : (
        <div className="min-h-screen bg-[#F2F2F7] pb-24">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-md mx-auto px-6 space-y-8">
        {(activeTab === 'upcoming' || activeTab === 'past') && (
          <>
            <button 
              onClick={() => openEditor()} 
              className="w-full py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center gap-2 text-blue-600 font-bold active:scale-[0.98] transition-all"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              Neues Spiel
            </button>
            <div className="space-y-3 pb-10">
              {(activeTab === 'upcoming' ? upcomingMatches : pastMatches).map(match => {
                const stats = getMatchStats(match.id);
                return (
                  <div 
                    key={match.id} 
                    onClick={() => openEditor(match)} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center active:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-slate-800 text-lg">{match.opponent}</div>
                        {match.team && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            {match.team}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                        <span>{formatDisplayDate(match.date)}</span>
                        <span>{match.time}</span>
                      </div>
                      <div className="mt-2 inline-block">
                        <StatusBadge openCount={stats.open} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteMatch(match.id, match.opponent, e)}
                        className="p-2 rounded-lg text-slate-400 active:text-red-500 hover:text-red-500 hover:bg-red-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
                        title="Spiel löschen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="bg-slate-50 p-2 rounded-xl text-slate-300">
                        <Settings className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {activeTab === 'settings' && (
          <ServiceTypeManager
            serviceTypes={serviceTypes}
            serviceTypeMembers={serviceTypeMembers}
            newServiceInput={newServiceInput}
            onNewServiceInputChange={setNewServiceInput}
            onAddServiceType={addServiceType}
            onDeleteServiceType={deleteServiceType}
            onAddMember={addServiceTypeMember}
            onDeleteMember={deleteServiceTypeMember}
          />
        )}
      </div>
        </div>
      )}

      {/* Dialog Components - Always available */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.onConfirm();
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
