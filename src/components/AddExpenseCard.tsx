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
  Pencil,
  ShoppingBag,
  Tag,
  AlertCircle,
  Plus,
  Wallet,
  Check
} from 'lucide-react';
import { ExpenseRecord, UserProfile, DailyExpenseItem, ExpenseCategory } from '../types';
import { formatCurrency, getTodayDateString, formatDisplayDate, CATEGORY_CONFIG } from '../lib/calculations';
import { saveMealExpense } from '../lib/firebase';

interface AddExpenseCardProps {
  user: UserProfile;
  existingRecords: ExpenseRecord[];
  initialSelectedDate?: string | null;
  onSaved?: (savedRecord: ExpenseRecord) => void;
  onClearEditing?: () => void;
  activeMessId?: string;
  activeMessName?: string;
  onSaveDailyExpense?: (expense: Omit<DailyExpenseItem, 'id'> & { id?: string }) => Promise<any>;
}

export const AddExpenseCard: React.FC<AddExpenseCardProps> = ({
  user,
  existingRecords,
  initialSelectedDate,
  onSaved,
  onClearEditing,
  activeMessId = 'default',
  activeMessName,
  onSaveDailyExpense,
}) => {
  // Mode: Meal Record (Breakfast/Lunch/Dinner) OR Personal Daily Expense
  const [activeMode, setActiveMode] = useState<'meal' | 'daily'>('meal');

  // Common Date
  const [date, setDate] = useState<string>(initialSelectedDate || getTodayDateString());

  // Meal Form State
  const [breakfast, setBreakfast] = useState<string>('');
  const [lunch, setLunch] = useState<string>('');
  const [dinner, setDinner] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExistingRecord, setIsExistingRecord] = useState<boolean>(false);

  // Daily Personal Expense Form State
  const [personalTitle, setPersonalTitle] = useState<string>('');
  const [personalAmount, setPersonalAmount] = useState<string>('');
  const [personalCategory, setPersonalCategory] = useState<ExpenseCategory>('groceries');
  const [personalPaymentMethod, setPersonalPaymentMethod] = useState<string>('Cash');
  const [personalNotes, setPersonalNotes] = useState<string>('');

  // Status & Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync date when parent requests editing a specific date
  useEffect(() => {
    if (initialSelectedDate) {
      setDate(initialSelectedDate);
      setActiveMode('meal');
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
  }, [date]); // Only re-run when user switches date

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

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);
    try {
      const saved = await saveMealExpense(user.uid, date, bVal, lVal, dVal, user, activeMessId);
      setSuccessMessage(`Meal record for ${dateFormatted} saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      if (onSaved) {
        onSaved(saved);
      }
    } catch (err: any) {
      console.error('Failed to save meal expense:', err);
      setErrorMessage(err?.message || 'Failed to save meal record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = personalTitle.trim();
    const parsedAmount = parseFloat(personalAmount);

    if (!trimmedTitle) {
      setErrorMessage('Please enter an expense name (e.g. Snacks, Notebook, Laundry).');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount greater than Rs. 0.');
      return;
    }

    if (!onSaveDailyExpense) {
      setErrorMessage('Daily expense saving is not configured.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDailyExpense({
        title: trimmedTitle,
        amount: parsedAmount,
        category: personalCategory,
        date: date || getTodayDateString(),
        paymentMethod: personalPaymentMethod,
        notes: personalNotes.trim(),
      });

      setSuccessMessage(`Expense "${trimmedTitle}" (Rs. ${parsedAmount}) saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setPersonalTitle('');
      setPersonalAmount('');
      setPersonalNotes('');
    } catch (err: any) {
      console.error('Failed to save daily expense:', err);
      setErrorMessage(err?.message || 'Failed to save daily expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBreakfast('');
    setLunch('');
    setDinner('');
    setPersonalTitle('');
    setPersonalAmount('');
    setPersonalNotes('');
    setErrorMessage(null);
    if (onClearEditing) onClearEditing();
  };

  const quickPersonalSuggestions = [
    { title: 'Chai & Paratha', category: 'dining' as ExpenseCategory, amount: '90' },
    { title: 'Campus Groceries', category: 'groceries' as ExpenseCategory, amount: '350' },
    { title: 'Photocopies & Notes', category: 'academics' as ExpenseCategory, amount: '60' },
    { title: 'Rickshaw / Bus Fare', category: 'transport' as ExpenseCategory, amount: '100' },
    { title: 'Hostel Laundry', category: 'other' as ExpenseCategory, amount: '180' },
  ];

  return (
    <div
      id="add-expense-card"
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all relative overflow-hidden"
    >
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeMode === 'meal'
                ? (isExistingRecord ? 'Edit Mess Meal Record' : 'Add Mess Meal Record')
                : 'Add Daily Personal Expense'}
            </h2>
            {activeMode === 'meal' && isExistingRecord && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Pencil className="w-3 h-3" />
                Editing existing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMode === 'meal'
              ? 'Log breakfast, lunch, and dinner to calculate your daily university mess cost.'
              : 'Log personal spending outside the mess (snacks, groceries, commute, academics).'}
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto shrink-0">
          <button
            id="tab-mode-meal"
            type="button"
            onClick={() => {
              setActiveMode('meal');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'meal'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Mess Meals (B/L/D)</span>
          </button>
          <button
            id="tab-mode-daily"
            type="button"
            onClick={() => {
              setActiveMode('daily');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Personal Expense</span>
          </button>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Confirmation Toast */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Date Header for Both Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Expense Date:
          </label>
          <div className="relative">
            <input
              id="expense-date-input"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer shadow-xs"
            />
          </div>
          {dateRelative && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {dateRelative}
            </span>
          )}
        </div>

        {/* Quick Date Shortcuts */}
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

      {/* MODE 1: Mess Meal Record (Breakfast, Lunch, Dinner) */}
      {activeMode === 'meal' && (
        <form onSubmit={handleSaveMeal} className="space-y-5">
          {isExistingRecord && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Existing meal entry found for {dateFormatted}. Saving will update it.
            </p>
          )}

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
              {/* Quick add chips */}
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
              {/* Quick add chips */}
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
              {/* Quick add chips */}
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
                    <span>{isExistingRecord ? 'Update Record' : 'Save Meal Record'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODE 2: Personal Daily Expense (Groceries, Snacks, Travel, Bills) */}
      {activeMode === 'daily' && (
        <form onSubmit={handleSavePersonal} className="space-y-4">
          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPersonalSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPersonalTitle(item.title);
                    setPersonalCategory(item.category);
                    setPersonalAmount(item.amount);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {item.title} (Rs. {item.amount})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Title / Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Item / Expense Title *
              </label>
              <input
                id="personal-expense-title-input"
                type="text"
                required
                placeholder="e.g. Chai & Paratha, Notebooks, Rickshaw fare"
                value={personalTitle}
                onChange={(e) => setPersonalTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (Rs.) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  id="personal-expense-amount-input"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  value={personalAmount}
                  onChange={(e) => setPersonalAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              {/* Quick Increment Chips */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {[50, 100, 200, 500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const curr = parseFloat(personalAmount) || 0;
                      setPersonalAmount((curr + inc).toString());
                    }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={personalPaymentMethod}
                onChange={(e) => setPersonalPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="Cash">💵 Cash</option>
                <option value="Easypaisa">📱 Easypaisa</option>
                <option value="JazzCash">📱 JazzCash</option>
                <option value="SadaPay">💳 SadaPay</option>
                <option value="NayaPay">💳 NayaPay</option>
                <option value="Raast">⚡ Raast / Bank Transfer</option>
                <option value="Card">💳 Debit / Credit Card</option>
                <option value="Other">💡 Other</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'dining',
                  'groceries',
                  'academics',
                  'transport',
                  'housing',
                  'shopping',
                  'subscriptions',
                  'health',
                  'other'
                ] as ExpenseCategory[]
              ).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const isSelected = personalCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPersonalCategory(cat)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{conf?.emoji || '💡'}</span>
                    <span>{conf?.label || cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Note / Location (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Canteen, Stationery shop, split with roommate"
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
            <button
              id="save-personal-expense-btn"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Personal Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
