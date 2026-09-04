import React, { useState, useEffect, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { RecordsView } from './components/RecordsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import {
  subscribeAuthState,
  subscribeUserExpenses,
  subscribeUserMesses,
  deleteMealExpense,
  logOutUser,
  getFirebaseServices
} from './lib/firebase';
import {
  computeMonthSummary,
  getCurrentMonthKey
} from './lib/calculations';
import { ExpenseRecord, UserProfile, MessLedger } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'reports' | 'settings'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [allRecords, setAllRecords] = useState<ExpenseRecord[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Multi-mess (multiple ledgers) state
  const [messes, setMesses] = useState<MessLedger[]>([
    { id: 'default', name: 'Main Mess', icon: '🍲', createdAt: new Date().toISOString() }
  ]);
  const [activeMessId, setActiveMessIdState] = useState<string>(() => {
    return localStorage.getItem('messmate_active_mess_id') || 'default';
  });

  const setActiveMessId = (id: string) => {
    setActiveMessIdState(id);
    localStorage.setItem('messmate_active_mess_id', id);
  };

  // Dark mode state: default to crisp light mode unless explicitly saved as 'dark'
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('messmate_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('messmate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('messmate_theme', 'light');
    }
  }, [isDarkMode]);

  // Auth observer
  useEffect(() => {
    const unsub = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to user messes (multi-ledger support)
  useEffect(() => {
    if (!user) {
      setMesses([{ id: 'default', name: 'Main Mess', icon: '🍲', createdAt: new Date().toISOString() }]);
      return;
    }

    const unsub = subscribeUserMesses(
      user.uid,
      (userMesses) => {
        if (userMesses.length > 0) {
          setMesses(userMesses);
          // If the currently selected mess was deleted or doesn't exist in list, select first available
          setActiveMessIdState((curr) => {
            const exists = userMesses.some((m) => m.id === curr);
            if (!exists) {
              const fallback = userMesses[0].id;
              localStorage.setItem('messmate_active_mess_id', fallback);
              return fallback;
            }
            return curr;
          });
        }
      },
      user
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user]);

  // Subscribe to user expenses when user or activeMessId changes
  useEffect(() => {
    if (!user) {
      setAllRecords([]);
      return;
    }

    const unsub = subscribeUserExpenses(
      user.uid,
      (records) => {
        setAllRecords(records);
      },
      user,
      activeMessId
    );

    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [user, activeMessId]);

  // Calculations for currently selected month
  const monthSummary = useMemo(() => {
    return computeMonthSummary(allRecords, selectedMonth);
  }, [allRecords, selectedMonth]);

  const activeMess = messes.find((m) => m.id === activeMessId) || messes[0];

  const { isConfigured: isFirebaseConnected } = getFirebaseServices();

  const handleEditRecord = (date: string) => {
    setEditingDate(date);
    setActiveTab('dashboard');
    // Scroll smoothly to add expense card
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleDeleteRecord = async (date: string) => {
    if (!user) return;
    try {
      await deleteMealExpense(user.uid, date, user, activeMessId);
      if (editingDate === date) {
        setEditingDate(null);
      }
    } catch (err) {
      console.error('Failed to delete expense record:', err);
    }
  };

  const handleLogout = async () => {
    await logOutUser();
    setUser(null);
    setEditingDate(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Loading MessMate...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onSuccess={(loggedUser) => setUser(loggedUser)}
        isFirebaseConfigured={isFirebaseConnected}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isFirebaseConnected={isFirebaseConnected}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthSummary={monthSummary}
            allRecords={allRecords}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onViewAllRecords={() => setActiveTab('records')}
            editingDate={editingDate}
            onClearEditing={() => setEditingDate(null)}
            messes={messes}
            activeMessId={activeMessId}
            onSelectMess={setActiveMessId}
          />
        )}

        {activeTab === 'records' && (
          <RecordsView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthSummary={monthSummary}
            allRecords={allRecords}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            activeMessName={activeMess?.name}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthSummary={monthSummary}
            allRecords={allRecords}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            isFirebaseConnected={isFirebaseConnected}
            allRecords={allRecords}
            onLogout={handleLogout}
          />
        )}

        {/* Global Footer */}
        <footer id="app-footer" className="mt-12 py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Created by</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Yahya Siddiqui</span>
            <span>for students with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline-block shrink-0 animate-pulse" aria-label="heart" />
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            MessMate • University Daily Food & Mess Ledger
          </p>
        </footer>
      </main>
    </div>
  );
}
