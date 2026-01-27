'use client';

import { Calendar, Settings, LogOut, History, AlertCircle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  activeTab: 'upcoming' | 'past' | 'settings' | 'cancellations' | 'trash';
  onTabChange: (tab: 'upcoming' | 'past' | 'settings' | 'cancellations' | 'trash') => void;
  cancellationCount: number;
}

/**
 * AdminHeader Component
 * Header with logout button and tab switcher for admin panel
 */
export default function AdminHeader({ activeTab, onTabChange, cancellationCount }: AdminHeaderProps) {
  const router = useRouter();
  const displayCount = cancellationCount > 99 ? '99+' : `${cancellationCount}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-slate-900 text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-xl shadow-slate-900/20 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-black">Admin Cockpit</h1></div>
        <button 
          onClick={handleLogout} 
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm">
        <button 
          onClick={() => onTabChange('upcoming')} 
          className={clsx(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'upcoming' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <Calendar className="w-4 h-4" /> Kommende
        </button>
        <button 
          onClick={() => onTabChange('cancellations')} 
          className={clsx(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'cancellations' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <AlertCircle className="w-4 h-4" /> Austragungen
          {cancellationCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 text-[10px] font-black bg-red-500 text-white rounded-full">
              {displayCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => onTabChange('trash')} 
          className={clsx(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'trash' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <Trash2 className="w-4 h-4" /> Papierkorb
        </button>
        <button 
          onClick={() => onTabChange('past')} 
          className={clsx(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'past' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <History className="w-4 h-4" /> Vergangen
        </button>
        <button 
          onClick={() => onTabChange('settings')} 
          className={clsx(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" /> Kategorien
        </button>
      </div>
    </header>
  );
}
