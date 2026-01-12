'use client';

import { Plus, LayoutList, X } from 'lucide-react';
import { ServiceType } from '@/types';

interface ServiceTypeManagerProps {
  serviceTypes: ServiceType[];
  newServiceInput: string;
  onNewServiceInputChange: (value: string) => void;
  onAddServiceType: () => void;
  onDeleteServiceType: (id: number) => void;
}

/**
 * ServiceTypeManager Component
 * Manages service type categories (settings tab)
 */
export default function ServiceTypeManager({
  serviceTypes,
  newServiceInput,
  onNewServiceInputChange,
  onAddServiceType,
  onDeleteServiceType,
}: ServiceTypeManagerProps) {
  return (
    <>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center px-4">
          <LayoutList className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            value={newServiceInput} 
            onChange={e => onNewServiceInputChange(e.target.value)}
            placeholder="Neue Kategorie..."
            className="w-full py-4 bg-transparent text-sm font-bold text-slate-900 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onAddServiceType();
              }
            }}
          />
        </div>
        <button 
          onClick={onAddServiceType}
          className="bg-slate-900 text-white px-5 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2">
        {serviceTypes.map(type => (
          <div 
            key={type.id} 
            className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center"
          >
            <span className="font-bold text-slate-700 text-sm">{type.name}</span>
            <button 
              onClick={() => onDeleteServiceType(type.id)} 
              className="text-slate-300 hover:text-red-500 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
