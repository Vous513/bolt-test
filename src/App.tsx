import { useState, useEffect } from 'react';
import CalendarPage from './components/CalendarPage';
import DayPage from './components/DayPage';
import Auth from './components/Auth';
import { supabase, User } from './lib/supabase';

type View = 'calendar' | 'day';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleDaySelect(date: Date) {
    setSelectedDate(date);
    setCurrentView('day');
  }

  function handleBackToCalendar() {
    setCurrentView('calendar');
    setSelectedDate(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-2 z-50 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Signed in as: <span className="font-medium text-slate-800">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      <div className="pt-10">
        {currentView === 'calendar' && (
          <CalendarPage onDaySelect={handleDaySelect} userId={user.id} />
        )}
        {currentView === 'day' && selectedDate && (
          <DayPage date={selectedDate} onBackToCalendar={handleBackToCalendar} userId={user.id} />
        )}
      </div>
    </>
  );
}

export default App;
