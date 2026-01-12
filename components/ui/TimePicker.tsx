'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimePicker({ value, onChange, placeholder = 'Zeit wählen', className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [selectedHour, setSelectedHour] = useState(value?.split(':')[0] || '14');
  const [selectedMinute, setSelectedMinute] = useState(value?.split(':')[1] || '30');

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '14');
      setSelectedMinute(minute || '30');
    }
  }, [value]);

  const handleTimeSelect = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  const displayValue = value || placeholder;

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Button that looks like input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 outline-none border border-transparent',
          'focus:border-blue-100 focus:bg-blue-50/50 transition-all',
          'flex items-center justify-between',
          !value && 'text-slate-400'
        )}
      >
        <span>{displayValue}</span>
        <Clock className="w-4 h-4 text-slate-400" />
      </button>

      {/* Time Selection Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 p-4 min-w-[200px]">
          <div className="flex gap-3">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Stunden
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeSelect(hour, selectedMinute)}
                    className={clsx(
                      'w-full py-2 px-3 rounded-lg text-sm font-bold transition-all',
                      'hover:bg-blue-50 active:scale-95',
                      selectedHour === hour
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:text-slate-900'
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Minuten
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeSelect(selectedHour, minute)}
                    className={clsx(
                      'w-full py-2 px-3 rounded-lg text-sm font-bold transition-all',
                      'hover:bg-blue-50 active:scale-95',
                      selectedMinute === minute
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:text-slate-900'
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
