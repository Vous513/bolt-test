import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CalendarPageProps {
  onDaySelect: (date: Date) => void;
  userId: string;
}

export default function CalendarPage({ onDaySelect, userId }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchAvailableDates();
  }, [year, month, userId]);

  async function fetchAvailableDates() {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const { data } = await supabase
      .from('availability')
      .select('date')
      .eq('is_available', true)
      .eq('user_id', userId)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);

    if (data) {
      const dateSet = new Set(data.map((item: { date: string }) => item.date));
      setAvailableDates(dateSet);
    }
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-20 md:h-24" />);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const hasAvailability = availableDates.has(dateStr);

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDaySelect(date)}
        className={`h-20 md:h-24 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1
          ${isToday
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }
          ${hasAvailability
            ? 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200'
            : ''
          }
        `}
      >
        <span className={`text-lg font-semibold ${hasAvailability ? 'text-emerald-700' : 'text-gray-700'}`}>
          {day}
        </span>
        {hasAvailability && (
          <span className="text-xs font-medium text-emerald-600">Available</span>
        )}
      </button>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold">{monthName} {year}</h1>
                <button
                  onClick={goToToday}
                  className="text-sm text-slate-300 hover:text-white mt-1 transition-colors"
                >
                  Go to Today
                </button>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4 md:p-6">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays}
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50"></div>
              <span className="text-slate-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-emerald-400 bg-emerald-100"></div>
              <span className="text-slate-600">Days with availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
