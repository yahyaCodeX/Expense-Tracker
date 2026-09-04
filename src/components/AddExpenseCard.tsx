import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Coffee,
  Utensils,
  Soup,
  Save,
  CheckCircle2,
  Clock,
  RotateCcw,
  Pencil
} from 'lucide-react';
import { ExpenseRecord, UserProfile } from '../types';
import { formatCurrency, getTodayDateString, formatDisplayDate } from '../lib/calculations';
import { saveMealExpense } from '../lib/firebase';

interface AddExpenseCardProps {
  user: UserProfile;
  existingRecords: ExpenseRecord[];
  initialSelectedDate?: string | null;
  onSaved?: (savedRecord: ExpenseRecord) => void;
  onClearEditing?: () => void;
  activeMessId?: string;
  activeMessName?: string;
}

export const AddExpenseCard: React.FC<AddExpenseCardProps> = ({
  user,
  existingRecords,
  initialSelectedDate,
  onSaved,
  onClearEditing,
  activeMessId = 'default',
  activeMessName,
}) => {
  const [date, setDate] = useState<string>(initialSelectedDate || getTodayDateString());
  const [breakfast, setBreakfast] = useState<string>('');
  const [lunch, setLunch] = useState<string>('');
  const [dinner, setDinner] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isExistingRecord, setIsExistingRecord] = useState<boolean>(false);

  // Sync date when parent requests editing a specific date
  useEffect(() => {
    if (initialSelectedDate) {
      setDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  // When date changes, load matched record if available
  useEffect(() => {
    const matched = existingRecords.find((r) => r.date === date);
    if (matched) {
      setIsExistingRecord(true);
      setBreakfast(matched.breakfast ? String(matched.breakfast) : '0');
      setLunch(matched.lunch ? String(matched.lunch) : '0');
      setDinner(matched.dinner ? String(matched.dinner) : '0');
    } else {
      setIsExistingRecord(false);
      setBreakfast('');
      setLunch('');
      setDinner('');
    }
  }, [date]); // Only re-run when the user switches date, preventing typing disruption

  // Live calculation of daily total
  const bVal = Math.max(0, Number(breakfast) || 0);
  const lVal = Math.max(0, Number(lunch) || 0);
  const dVal = Math.max(0, Number(dinner) || 0);
  const dailyTotal = bVal + lVal + dVal;

  const { formatted: dateFormatted, relative: dateRelative } = formatDisplayDate(date);

  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const addAmount = (current: string, setFn: (val: string) => void, amount: number) => {
    const currNum = Math.max(0, Number(current) || 0);
    setFn(String(currNum + amount));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSaving(true);
    try {
      const saved = await saveMealExpense(user.uid, date, bVal, lVal, dVal, user, activeMessId);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      if (onSaved) {
        onSaved(saved);
      }
    } catch (err) {
      console.error('Failed to save meal expense:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBreakfast('');
    setLunch('');
    setDinner('');
    if (onClearEditing) onClearEditing();
  };

  return (
    <div
      id="add-expense-card"
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all relative overflow-hidden"
    >
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isExistingRecord ? 'Edit Meal Record' : 'Add Meal Record'}
            </h2>
            {isExistingRecord && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Pencil className="w-3 h-3" />
                Editing existing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log breakfast, lunch, and dinner to calculate your daily university mess cost.
          </p>
        </div>

        {/* Quick Date buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickDate(0)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate(1)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Yesterday
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Date Selector */}
        <div>
          <div className="flex items-center justify-between max-w-sm mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Meal Date
            </label>
            {dateRelative && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {dateRelative}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-sm w-full">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="expense-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-xs"
              />
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <span>Calendar Date:</span>
              <span className="text-amber-600 dark:text-amber-400">{dateFormatted}</span>
            </div>
          </div>
          {isExistingRecord && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Existing entry found for {dateFormatted}. Modifying will update it.
            </p>
          )}
        </div>

        {/* 3 Meals Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Breakfast Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-colors focus-within:border-amber-500 dark:focus-within:border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>Breakfast</span>
              </div>
              <button
                type="button"
                onClick={() => setBreakfast('0')}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 cursor-pointer touch-manipulation"
              >
                Skip (0)
              </button>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">Rs.</span>
              <input
                id="expense-breakfast-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                step="1"
                placeholder="0"
                value={breakfast}
                onChange={(e) => setBreakfast(e.target.value)}
                className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[44px]"
              />
            </div>
            {/* Quick add chips for mobile */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[30, 50, 80].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addAmount(breakfast, setBreakfast, amt)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer touch-manipulation"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Lunch Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-colors focus-within:border-amber-500 dark:focus-within:border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Utensils className="w-4 h-4 text-orange-500" />
                <span>Lunch</span>
              </div>
              <button
                type="button"
                onClick={() => setLunch('0')}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 cursor-pointer touch-manipulation"
              >
                Skip (0)
              </button>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">Rs.</span>
              <input
                id="expense-lunch-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                step="1"
                placeholder="0"
                value={lunch}
                onChange={(e) => setLunch(e.target.value)}
                className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[44px]"
              />
            </div>
            {/* Quick add chips for mobile */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[50, 100, 150].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addAmount(lunch, setLunch, amt)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer touch-manipulation"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Dinner Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-colors focus-within:border-amber-500 dark:focus-within:border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Soup className="w-4 h-4 text-emerald-500" />
                <span>Dinner</span>
              </div>
              <button
                type="button"
                onClick={() => setDinner('0')}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 cursor-pointer touch-manipulation"
              >
                Skip (0)
              </button>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">Rs.</span>
              <input
                id="expense-dinner-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                step="1"
                placeholder="0"
                value={dinner}
                onChange={(e) => setDinner(e.target.value)}
                className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[44px]"
              />
            </div>
            {/* Quick add chips for mobile */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[50, 100, 150].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addAmount(dinner, setDinner, amt)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer touch-manipulation"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Automatic Calculation Banner & Action Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-slate-800 border border-amber-200/70 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Automatically Calculated
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Daily Total:
              </span>
              <span
                id="calculated-daily-total"
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
              >
                {formatCurrency(dailyTotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {(breakfast || lunch || dinner || isExistingRecord) && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset fields"
                className="py-3 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              id="save-record-btn"
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none py-3.5 px-7 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-60 cursor-pointer min-w-[170px]"
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isExistingRecord ? 'Update Record' : 'Save Record'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success confirmation toast */}
        {showSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Record for {date} successfully saved and calculations updated!</span>
          </div>
        )}
      </form>
    </div>
  );
};
