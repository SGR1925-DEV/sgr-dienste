'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'Datum wählen', className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
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

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Montag
  const days = eachDayOfInterval({ start: calendarStart, end: monthEnd });

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const displayValue = value ? format(value, 'EEE, dd.MM.yyyy', { locale: de }) : placeholder;

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
        <Calendar className="w-4 h-4 text-slate-400" />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[280px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="font-bold text-slate-900">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-slate-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isSelected = value && isSameDay(day, value);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={!isCurrentMonthDay}
                  className={clsx(
                    'aspect-square rounded-lg text-sm font-bold transition-all',
                    'hover:bg-blue-50 active:scale-95',
                    !isCurrentMonthDay && 'text-slate-300 cursor-not-allowed',
                    isCurrentMonthDay && !isSelected && 'text-slate-700 hover:text-slate-900',
                    isSelected && 'bg-blue-600 text-white shadow-lg',
                    isToday && !isSelected && 'ring-2 ring-blue-400/50'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
