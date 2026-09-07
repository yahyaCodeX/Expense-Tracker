import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Pencil,
  Check,
  X,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  PiggyBank,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency } from '../lib/calculations';

interface PocketMoneyCardProps {
  selectedMonth: string; // YYYY-MM
  monthName: string;
  pocketMoney: number;
  onSavePocketMoney: (amount: number) => Promise<void>;
  grandTotalSpent: number;
  messTotalSpent: number;
  otherExpensesTotalSpent: number;
  forceEdit?: boolean;
  onCloseForceEdit?: () => void;
}

export const PocketMoneyCard: React.FC<PocketMoneyCardProps> = ({
  selectedMonth,
  monthName,
  pocketMoney,
  onSavePocketMoney,
  grandTotalSpent,
  messTotalSpent,
  otherExpensesTotalSpent,
  forceEdit,
  onCloseForceEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState(pocketMoney > 0 ? pocketMoney.toString() : '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setInputAmount(pocketMoney > 0 ? pocketMoney.toString() : '');
  }, [pocketMoney, selectedMonth]);

  useEffect(() => {
    if (forceEdit) {
      setIsEditing(true);
    }
  }, [forceEdit]);

  // Remaining days in selected month
  const getRemainingDays = () => {
    const [y, m] = (selectedMonth || '').split('-').map(Number);
    if (!y || !m) return 0;
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    const daysInMonth = new Date(y, m, 0).getDate();
    if (!isCurrentMonth) {
      const selectedDate = new Date(y, m - 1, 1);
      const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (selectedDate < currentDate) return 0;
      return daysInMonth;
    }
    const currentDay = now.getDate();
    return Math.max(0, daysInMonth - currentDay);
  };

  const remainingDays = getRemainingDays();
  const hasPocketMoney = pocketMoney > 0;
  const remainingBalance = pocketMoney - grandTotalSpent;
  const isOverBudget = hasPocketMoney && remainingBalance < 0;
  const spentPercentage = hasPocketMoney
    ? Math.round((grandTotalSpent / pocketMoney) * 100)
    : 0;
  const isOver90Percent = hasPocketMoney && spentPercentage >= 90;
  const safeDailyAllowance =
    hasPocketMoney && remainingBalance > 0 && remainingDays > 0
      ? Math.round(remainingBalance / remainingDays)
      : 0;

  const handleOpenEdit = () => {
    setInputAmount(pocketMoney > 0 ? pocketMoney.toString() : '');
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setInputAmount(pocketMoney > 0 ? pocketMoney.toString() : '');
    if (onCloseForceEdit) {
      onCloseForceEdit();
    }
  };

  const handleSave = async (amountToSave?: number) => {
    const val = amountToSave !== undefined ? amountToSave : parseFloat(inputAmount);
    if (isNaN(val) || val < 0) return;
    setIsSaving(true);
    try {
      await onSavePocketMoney(val);
      setIsEditing(false);
      if (onCloseForceEdit) {
        onCloseForceEdit();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const quickPresets = [5000, 10000, 15000, 20000, 25000, 30000];

  return (
    <div
      id="pocket-money-budget-card"
      className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-xs overflow-hidden transition-all ${
        isOver90Percent
          ? 'border-rose-400/90 dark:border-rose-600 ring-2 ring-rose-500/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              isOver90Percent
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isOver90Percent ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <PiggyBank className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Monthly Budget Cap & Pocket Money
              </h2>
              {hasPocketMoney && (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-all ${
                    isOverBudget
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                      : isOver90Percent
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                      : spentPercentage >= 75
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {isOverBudget
                    ? `🚨 Exceeded Cap (${spentPercentage}%)`
                    : isOver90Percent
                    ? `⚠️ >90% Alert (${spentPercentage}%)`
                    : `${spentPercentage}% Spent`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total monthly spending cap & allowance for {monthName}
            </p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              id="edit-pocket-money-btn"
              type="button"
              onClick={handleOpenEdit}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isOver90Percent
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{hasPocketMoney ? 'Adjust Budget Cap' : '+ Set Budget Cap'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCloseEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Edit Form Section */}
      {isEditing && (
        <div className="p-5 sm:p-6 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Set Monthly Budget Cap (Rs.) for {monthName}
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  id="budget-cap-input"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 25000"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="save-budget-cap-btn"
                  disabled={isSaving}
                  onClick={() => handleSave()}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Budget Cap'}</span>
                </button>
                {hasPocketMoney && (
                  <button
                    type="button"
                    onClick={() => handleSave(0)}
                    title="Remove budget cap setting"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Budget Cap Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInputAmount(preset.toString())}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    inputAmount === preset.toString()
                      ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  Rs. {preset.toLocaleString('en-PK')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!hasPocketMoney ? (
        <div className="p-5 sm:p-6 text-center space-y-3">
          <div className="max-w-md mx-auto">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No monthly budget cap set for {monthName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set a monthly spending ceiling to track daily expenses and receive visual alerts as soon as spending exceeds 90% of your cap.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {quickPresets.slice(1, 5).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSave(preset)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-800 dark:text-slate-300 dark:hover:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Set Rs. {preset.toLocaleString('en-PK')}
              </button>
            ))}
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Set Custom Cap
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 space-y-5">
          {/* 3 Metric Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Budget Cap */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Monthly Budget Cap
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(pocketMoney)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                Total monthly limit
              </span>
            </div>

            {/* Total Spent */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isOver90Percent
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isOver90Percent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Total Spent So Far
                </span>
                {isOver90Percent && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-600 text-white uppercase animate-pulse">
                    &gt;90% Cap
                  </span>
                )}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isOver90Percent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatCurrency(grandTotalSpent)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
                Mess: {formatCurrency(messTotalSpent)} • Daily: {formatCurrency(otherExpensesTotalSpent)}
              </span>
            </div>

            {/* Remaining Balance */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isOverBudget
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                  : isOver90Percent
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : remainingBalance <= pocketMoney * 0.25
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isOverBudget || isOver90Percent
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isOverBudget ? 'Over Budget Cap By' : 'Remaining Balance'}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isOverBudget || isOver90Percent
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(Math.abs(remainingBalance))}
              </div>
              <span
                className={`text-xs mt-1 block font-medium ${
                  isOverBudget || isOver90Percent
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isOverBudget
                  ? 'Exceeded monthly budget cap'
                  : isOver90Percent
                  ? 'Warning: Less than 10% budget remaining'
                  : `${100 - Math.min(100, spentPercentage)}% of budget cap left`}
              </span>
            </div>
          </div>

          {/* Progress Bar & Pace Guidance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Budget Cap Utilization</span>
                <span
                  className={`font-black ${
                    isOver90Percent
                      ? 'text-rose-600 dark:text-rose-400'
                      : spentPercentage >= 75
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  ({spentPercentage}%)
                </span>
                {isOver90Percent && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                    Alert: &gt;90%
                  </span>
                )}
              </span>
              <span className={isOver90Percent ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                {formatCurrency(grandTotalSpent)} / {formatCurrency(pocketMoney)}
              </span>
            </div>

            {/* Visual Bar - Turns Red when >= 90% */}
            <div
              className={`w-full h-3.5 rounded-full overflow-hidden flex transition-all ${
                isOver90Percent
                  ? 'bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/80 p-0.5'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <div
                style={{ width: `${Math.min(100, spentPercentage)}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  isOver90Percent
                    ? 'bg-rose-600 shadow-sm shadow-rose-600/50 animate-pulse'
                    : spentPercentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>

            {/* Insights Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {remainingDays > 0
                    ? `${remainingDays} days remaining this month`
                    : 'Month completed'}
                </span>
              </div>

              {isOver90Percent ? (
                <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {isOverBudget
                      ? 'Budget Cap exceeded! Avoid further non-essential spending.'
                      : 'High Alert: Expenses exceeded 90% of cap! Restrict daily expenses.'}
                  </span>
                </div>
              ) : (
                remainingDays > 0 && remainingBalance > 0 && (
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800">
                    <Sparkles className="w-3 h-3" />
                    <span>Safe spending pace: ~{formatCurrency(safeDailyAllowance)}/day</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

