import React from 'react';
import {
  UtensilsCrossed,
  LayoutDashboard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'records' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'records' | 'reports' | 'settings') => void;
  user: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isFirebaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isDarkMode,
  setIsDarkMode,
  isFirebaseConnected,
}) => {
  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  MessMate
                </span>
                <span className="text-sm">🍽️</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Daily Mess Expense Tracker
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                id="nav-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                id="nav-records"
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'records'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Records
              </button>

              <button
                id="nav-reports"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </button>

              <button
                id="nav-settings"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </nav>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Firebase / Local Mode Badge */}
            <div
              title={isFirebaseConnected ? 'Connected to Firebase Cloud' : 'Running in Local Storage Mode'}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                isFirebaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              {isFirebaseConnected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cloud Active</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Local Mode</span>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden lg:inline max-w-[130px] truncate">
                  {user.email || 'User'}
                </span>
                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
          <button
            id="mobile-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            id="mobile-nav-records"
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'records'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span>Records</span>
          </button>

          <button
            id="mobile-nav-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'reports'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Reports</span>
          </button>

          <button
            id="mobile-nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      )}
    </>
  );
};
