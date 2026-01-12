'use client';

import { useState } from 'react';
import { Plus, LayoutList, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { ServiceType, ServiceTypeMember } from '@/types';
import { clsx } from 'clsx';

interface ServiceTypeManagerProps {
  serviceTypes: ServiceType[];
  serviceTypeMembers: ServiceTypeMember[];
  newServiceInput: string;
  onNewServiceInputChange: (value: string) => void;
  onAddServiceType: () => void;
  onDeleteServiceType: (id: number) => void;
  onAddMember: (serviceTypeId: number, name: string) => void;
  onDeleteMember: (memberId: number) => void;
}

/**
 * ServiceTypeManager Component
 * Manages service type categories and their member datasets
 */
export default function ServiceTypeManager({
  serviceTypes,
  serviceTypeMembers,
  newServiceInput,
  onNewServiceInputChange,
  onAddServiceType,
  onDeleteServiceType,
  onAddMember,
  onDeleteMember,
}: ServiceTypeManagerProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [newMemberInputs, setNewMemberInputs] = useState<Record<number, string>>({});

  const toggleExpand = (typeId: number) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const getMembersForType = (typeId: number) => {
    return serviceTypeMembers.filter(m => m.service_type_id === typeId);
  };

  const handleAddMember = (typeId: number) => {
    const name = newMemberInputs[typeId]?.trim();
    if (!name) return;
    onAddMember(typeId, name);
    setNewMemberInputs(prev => ({ ...prev, [typeId]: '' }));
  };

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
        {serviceTypes.map(type => {
          const members = getMembersForType(type.id);
          const isExpanded = expandedTypes.has(type.id);
          const newMemberInput = newMemberInputs[type.id] || '';

          return (
            <div 
              key={type.id} 
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleExpand(type.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <span className="font-bold text-slate-700 text-sm">{type.name}</span>
                  {members.length > 0 && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {members.length} Person{members.length !== 1 ? 'en' : ''}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => onDeleteServiceType(type.id)} 
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <div className="space-y-3">
                    {/* Members List */}
                    {members.length > 0 && (
                      <div className="space-y-2">
                        {members.map(member => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700 text-sm">{member.name}</span>
                            </div>
                            <button
                              onClick={() => onDeleteMember(member.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Member Input */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white rounded-xl border border-slate-100 flex items-center px-3">
                        <Users className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                          type="text"
                          value={newMemberInput}
                          onChange={e => setNewMemberInputs(prev => ({ ...prev, [type.id]: e.target.value }))}
                          placeholder="Name hinzufügen..."
                          className="w-full py-2.5 bg-transparent text-sm font-medium text-slate-900 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddMember(type.id);
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleAddMember(type.id)}
                        className="bg-blue-600 text-white px-4 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
