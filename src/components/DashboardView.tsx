import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  CalendarDays,
  TrendingUp,
  Utensils,
  Coffee,
  Soup,
  Plus,
  Trash2,
  Pencil,
  ArrowRight
} from 'lucide-react';
import { ExpenseRecord, MonthSummary, UserProfile, MessLedger, DailyExpenseItem } from '../types';
import { formatCurrency, getMonthNavigation, formatDisplayDate } from '../lib/calculations';
import { AddExpenseCard } from './AddExpenseCard';
import { MessSelector } from './MessSelector';
import { PocketMoneyCard } from './PocketMoneyCard';

interface DashboardViewProps {
  user: UserProfile;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (val: string) => void;
  monthSummary: MonthSummary;
  allRecords: ExpenseRecord[];
  dailyExpenses?: DailyExpenseItem[];
  pocketMoney?: number;
  onSavePocketMoney?: (amount: number) => Promise<void>;
  onSaveDailyExpense?: (expense: Omit<DailyExpenseItem, 'id'> & { id?: string }) => Promise<any>;
  onEditRecord: (date: string) => void;
  onDeleteRecord: (date: string) => void;
  onViewAllRecords: () => void;
  editingDate: string | null;
  onClearEditing: () => void;
  messes: MessLedger[];
  activeMessId: string;
  onSelectMess: (messId: string) => void;
  onRecordSaved?: (record: ExpenseRecord) => void;
  onNavigateExpenses?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  selectedMonth,
  setSelectedMonth,
  monthSummary,
  allRecords = [],
  dailyExpenses = [],
  pocketMoney = 0,
  onSavePocketMoney,
  onSaveDailyExpense,
  onEditRecord,
  onDeleteRecord,
  onViewAllRecords,
  editingDate,
  onClearEditing,
  messes = [],
  activeMessId,
  onSelectMess,
  onRecordSaved,
  onNavigateExpenses,
}) => {
  // Monthly filtered records
  const safeRecords = Array.isArray(allRecords) ? allRecords : [];
  const safeMesses = Array.isArray(messes) ? messes : [];
  const monthlyRecords = safeRecords.filter((r) => r && r.date && r.date.startsWith(selectedMonth));
  const activeMess = safeMesses.find((m) => m.id === activeMessId) || safeMesses[0] || { id: 'default', name: 'Main Mess', icon: '🍲', createdAt: '' };

  // Calculate other daily personal expenses for selected month
  const safeDaily = Array.isArray(dailyExpenses) ? dailyExpenses : [];
  const monthDailyExpenses = safeDaily.filter((e) => e && e.date && e.date.startsWith(selectedMonth));
  const otherExpensesTotal = monthDailyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const grandTotalSpent = monthSummary.totalBill + otherExpensesTotal;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Mess Selector & Quick Switcher with + Add Mess */}
      <MessSelector
        user={user}
        messes={messes}
        activeMessId={activeMessId}
        onSelectMess={onSelectMess}
        monthlyTotalBill={monthSummary.totalBill}
      />

      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Selected Month
            </span>
            {activeMess && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {activeMess.icon} {activeMess.name}
              </span>
            )}
          </div>
          <h1
            id="current-month-heading"
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5"
          >
            <span>{monthSummary.monthName}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <button
            id="prev-month-btn"
            onClick={() => setSelectedMonth(getMonthNavigation(selectedMonth, -1))}
            title="Previous Month"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer min-h-[44px] flex-1 sm:flex-none text-center"
          />

          <button
            id="next-month-btn"
            onClick={() => setSelectedMonth(getMonthNavigation(selectedMonth, 1))}
            title="Next Month"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Pocket Money & Allowance Section */}
      {onSavePocketMoney && (
        <PocketMoneyCard
          selectedMonth={selectedMonth}
          monthName={monthSummary.monthName}
          pocketMoney={pocketMoney}
          onSavePocketMoney={onSavePocketMoney}
          grandTotalSpent={grandTotalSpent}
          messTotalSpent={monthSummary.totalBill}
          otherExpensesTotalSpent={otherExpensesTotal}
        />
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Grand Total Spent */}
        <div
          id="summary-grand-total"
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              💸 Total Spent
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(grandTotalSpent)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mess food + personal daily spending
          </p>
        </div>

        {/* 2. Monthly Mess Bill */}
        <div
          id="summary-monthly-bill"
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              🍲 Mess Food Bill
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(monthSummary.totalBill)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hostel mess meals ({monthSummary.totalMeals} meals)
          </p>
        </div>

        {/* 3. Other Personal Expenses */}
        <div
          id="summary-other-expenses"
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              🛍️ Other Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(otherExpensesTotal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {monthDailyExpenses.length} daily personal items
          </p>
        </div>

        {/* 4. Days Recorded */}
        <div
          id="summary-days-recorded"
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              📅 Days Recorded
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {monthSummary.daysRecorded}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Avg {monthSummary.daysRecorded > 0 ? formatCurrency(monthSummary.averagePerDay) : 'Rs. 0'}/day mess
          </p>
        </div>
      </div>

      {/* Sub-metrics breakdown row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50/50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-amber-200/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Breakfast Total
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(monthSummary.breakfastTotal)}
              </div>
            </div>
          </div>
          {monthSummary.skippedBreakfastCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-slate-800 text-amber-900 dark:text-amber-300">
              {monthSummary.skippedBreakfastCount} skipped
            </span>
          )}
        </div>

        <div className="bg-orange-50/50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-orange-200/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Lunch Total
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(monthSummary.lunchTotal)}
              </div>
            </div>
          </div>
          {monthSummary.skippedLunchCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-200/60 dark:bg-slate-800 text-orange-900 dark:text-orange-300">
              {monthSummary.skippedLunchCount} skipped
            </span>
          )}
        </div>

        <div className="bg-emerald-50/50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Soup className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Dinner Total
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(monthSummary.dinnerTotal)}
              </div>
            </div>
          </div>
          {monthSummary.skippedDinnerCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-slate-800 text-emerald-900 dark:text-emerald-300">
              {monthSummary.skippedDinnerCount} skipped
            </span>
          )}
        </div>
      </div>

      {/* Main Feature 3: Add Daily Expense */}
      <AddExpenseCard
        user={user}
        existingRecords={allRecords}
        initialSelectedDate={editingDate}
        onClearEditing={onClearEditing}
        activeMessId={activeMessId}
        activeMessName={activeMess?.name}
        onSaveDailyExpense={onSaveDailyExpense}
        onSaved={(saved) => {
          if (onRecordSaved) {
            onRecordSaved(saved);
          }
          const monthKey = saved.date.slice(0, 7);
          if (monthKey !== selectedMonth) {
            setSelectedMonth(monthKey);
          }
        }}
      />

      {/* Quick link to Unified Expense Tracker */}
      {onNavigateExpenses && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-slate-900 dark:to-slate-800/80 p-4 sm:p-5 rounded-3xl border border-amber-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Expenses & Monthly Budget Report
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Log groceries, rent, transport & view the combined report summing all mess bills and daily spending.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateExpenses}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <span>Track Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Feature 4: Monthly Records Preview List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recent Records for {monthSummary.monthName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {monthlyRecords.length} days logged ({activeMess?.name || 'Main Mess'})
            </p>
          </div>

          {monthlyRecords.length > 5 && (
            <button
              onClick={onViewAllRecords}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {monthlyRecords.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No meal records logged for {monthSummary.monthName} in this mess.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use the form above to add your first breakfast, lunch, or dinner record!
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (< sm) */}
            <div className="sm:hidden space-y-3">
              {monthlyRecords.slice(0, 7).map((rec) => {
                const daily = rec.dailyTotal || (rec.breakfast + rec.lunch + rec.dinner);
                const { formatted, relative } = formatDisplayDate(rec.date);
                return (
                  <div
                    key={rec.date}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatted}
                          </span>
                          {relative && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              {relative}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{rec.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(daily)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Breakfast</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.breakfast > 0 ? formatCurrency(rec.breakfast) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lunch</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.lunch > 0 ? formatCurrency(rec.lunch) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Dinner</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.dinner > 0 ? formatCurrency(rec.dinner) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => onEditRecord(rec.date)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-amber-600 touch-manipulation min-h-[36px]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteRecord(rec.date)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 touch-manipulation min-h-[36px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Breakfast</th>
                    <th className="py-3 px-3">Lunch</th>
                    <th className="py-3 px-3">Dinner</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {monthlyRecords.slice(0, 7).map((rec) => {
                    const daily = rec.dailyTotal || (rec.breakfast + rec.lunch + rec.dinner);
                    const { formatted, relative } = formatDisplayDate(rec.date);
                    return (
                      <tr
                        key={rec.date}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {formatted}
                            </span>
                            {relative && (
                              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                {relative}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block font-mono mt-0.5">{rec.date}</span>
                        </td>
                        <td className="py-3 px-3">
                          {rec.breakfast > 0 ? (
                            formatCurrency(rec.breakfast)
                          ) : (
                            <span className="text-slate-400 text-xs italic">Skipped</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {rec.lunch > 0 ? (
                            formatCurrency(rec.lunch)
                          ) : (
                            <span className="text-slate-400 text-xs italic">Skipped</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {rec.dinner > 0 ? (
                            formatCurrency(rec.dinner)
                          ) : (
                            <span className="text-slate-400 text-xs italic">Skipped</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(daily)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditRecord(rec.date)}
                              title="Edit record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(rec.date)}
                              title="Delete record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
