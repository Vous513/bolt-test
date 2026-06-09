import { useState, useEffect } from 'react';
import { Calendar, Save, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DayPageProps {
  date: Date;
  onBackToCalendar: () => void;
  userId: string;
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
  isAvailable: boolean;
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 22; hour++) {
    const startHour = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');
    slots.push({
      start: `${startHour}:00`,
      end: `${endHour}:00`,
      label: `${startHour}:00 - ${endHour}:00`,
      isAvailable: false,
    });
  }
  return slots;
}

function formatTimeSlot(hour: number): string {
  const startHour = hour.toString().padStart(2, '0');
  const endHour = (hour + 1).toString().padStart(2, '0');
  return `${startHour}:00-${endHour}:00`;
}

export default function DayPage({ date, onBackToCalendar, userId }: DayPageProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dateStr = date.toISOString().split('T')[0];
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchAvailability();
  }, [dateStr]);

  async function fetchAvailability() {
    setLoading(true);
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('date', dateStr)
      .eq('user_id', userId);

    if (data) {
      const availabilityMap = new Map(
        data.map((item: { time_slot: string; is_available: boolean }) => [
          item.time_slot,
          item.is_available,
        ])
      );

      setTimeSlots(
        generateTimeSlots().map((slot) => {
          const slotKey = `${slot.start}-${slot.end}`;
          return {
            ...slot,
            isAvailable: availabilityMap.get(slotKey) || false,
          };
        })
      );
    }
    setLoading(false);
  }

  function toggleSlot(index: number) {
    setTimeSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);

    // Upsert all time slots
    const updates = timeSlots.map((slot) => ({
      date: dateStr,
      time_slot: `${slot.start}-${slot.end}`,
      is_available: slot.isAvailable,
      user_id: userId,
    }));

    // Delete existing entries for this date and insert new ones
    await supabase.from('availability').delete().eq('date', dateStr).eq('user_id', userId);

    const { error } = await supabase
      .from('availability')
      .insert(updates);

    setSaving(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const availableCount = timeSlots.filter((s) => s.isAvailable).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-6">
            <h1 className="text-xl md:text-2xl font-bold">{formattedDate}</h1>
            <p className="text-slate-300 mt-1">Set your availability for this day</p>
          </div>

          {/* Time slots */}
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => toggleSlot(index)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-center
                        ${
                          slot.isAvailable
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }
                      `}
                    >
                      <div className="text-sm font-semibold">{slot.start}</div>
                      <div className="text-xs mt-1">to {slot.end}</div>
                      {slot.isAvailable && (
                        <Check size={16} className="mx-auto mt-1 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                {availableCount > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm text-center">
                    {availableCount} hour{availableCount !== 1 ? 's' : ''} marked as available
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200
                ${
                  saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }
                ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2">
                  <Check size={18} />
                  Saved!
                </span>
              ) : (
                <>
                  <Save size={18} />
                  Save Availability
                </>
              )}
            </button>

            <button
              onClick={onBackToCalendar}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Calendar size={18} />
              Calendar
            </button>
          </div>

          {/* Quick actions */}
          <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex gap-2 justify-center">
            <button
              onClick={() => {
                setTimeSlots((prev) => prev.map((s) => ({ ...s, isAvailable: true })));
                setSaved(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => {
                setTimeSlots((prev) => prev.map((s) => ({ ...s, isAvailable: false })));
                setSaved(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
