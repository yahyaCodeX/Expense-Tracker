import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  Trash2,
  Edit2,
  Check,
  X,
  PieChart,
  ShoppingBag,
  Bus,
  BookOpen,
  Home,
  Coffee,
  Shirt,
  Smartphone,
  HeartPulse,
  Utensils,
  CreditCard,
  Banknote,
  SmartphoneNfc,
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { DailyExpenseItem, ExpenseRecord, ExpenseCategory, UserProfile } from '../types';
import {
  formatCurrency,
  formatDisplayDate,
  getTodayDateString,
  getMonthNavigation,
  computeCombinedMonthSummary,
  CATEGORY_CONFIG,
  exportDailyExpensesToCSV,
  exportCombinedExpensesToCSV
} from '../lib/calculations';
import { PocketMoneyCard } from './PocketMoneyCard';

interface ExpensesViewProps {
  user: UserProfile | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  mealRecords?: ExpenseRecord[];
  allRecords?: ExpenseRecord[];
  dailyExpenses?: DailyExpenseItem[];
  pocketMoney?: number;
  onSavePocketMoney?: (amount: number) => Promise<void>;
  onSaveExpense: (expense: Omit<DailyExpenseItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  user,
  selectedMonth,
  setSelectedMonth,
  mealRecords = [],
  allRecords = [],
  dailyExpenses = [],
  pocketMoney = 0,
  onSavePocketMoney,
  onSaveExpense,
  onDeleteExpense,
}) => {
  // Normalize records
  const effectiveMealRecords = mealRecords && mealRecords.length > 0 ? mealRecords : (allRecords || []);
  const safeDailyExpenses = Array.isArray(dailyExpenses) ? dailyExpenses : [];

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(safeDailyExpenses.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter & Search state
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Combined calculations for the selected month
  const combinedSummary = useMemo(() => {
    return computeCombinedMonthSummary(effectiveMealRecords, safeDailyExpenses, selectedMonth, pocketMoney);
  }, [effectiveMealRecords, safeDailyExpenses, selectedMonth, pocketMoney]);

  // Filtered daily expenses for the selected month
  const monthDailyExpenses = useMemo(() => {
    return safeDailyExpenses.filter((e) => e && e.date && e.date.startsWith(selectedMonth));
  }, [safeDailyExpenses, selectedMonth]);

  // Display list with filters and search applied
  const displayedExpenses = useMemo(() => {
    return monthDailyExpenses
      .filter((item) => {
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        const matchesSearch =
          !searchQuery.trim() ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') {
          return b.amount - a.amount;
        }
        return b.date.localeCompare(a.date);
      });
  }, [monthDailyExpenses, filterCategory, searchQuery, sortBy]);

  const handleStartEdit = (item: DailyExpenseItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDate(item.date);
    setPaymentMethod(item.paymentMethod || 'Cash');
    setNotes(item.notes || '');
    setIsFormOpen(true);
    // Scroll smoothly to form
    const formEl = document.getElementById('expense-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setCategory('groceries');
    setDate(getTodayDateString());
    setPaymentMethod('Cash');
    setNotes('');
    setFormError(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedTitle) {
      setFormError('Please enter an item or expense name (e.g. Notebooks, Chai & Snacks, Bus Pass).');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid expense amount greater than Rs. 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveExpense({
        id: editingId || undefined,
        title: trimmedTitle,
        amount: parsedAmount,
        category,
        date: date || getTodayDateString(),
        paymentMethod,
        notes: notes.trim(),
      });

      // Ensure view shows the month of the newly saved expense
      const expenseMonth = (date || getTodayDateString()).slice(0, 7);
      if (expenseMonth && expenseMonth !== selectedMonth) {
        setSelectedMonth(expenseMonth);
      }

      setSuccessToast(
        editingId
          ? `Updated "${trimmedTitle}" (Rs. ${parsedAmount}) successfully!`
          : `Added "${trimmedTitle}" (Rs. ${parsedAmount}) successfully!`
      );
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);

      handleResetForm();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setFormError(err?.message || 'Failed to save daily expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Bus':
        return <Bus className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Home':
        return <Home className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Shirt':
        return <Shirt className={className} />;
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'HeartPulse':
        return <HeartPulse className={className} />;
      case 'Utensils':
        return <Utensils className={className} />;
      default:
        return <Tag className={className} />;
    }
  };

  const quickSuggestions = [
    { title: 'Campus Groceries & Milk', category: 'groceries' as ExpenseCategory },
    { title: 'Rickshaw / Bus Fare', category: 'transport' as ExpenseCategory },
    { title: 'Photocopies & Stationery', category: 'academics' as ExpenseCategory },
    { title: 'Hostel Laundry & Ironing', category: 'housing' as ExpenseCategory },
    { title: 'Evening Chai & Paratha', category: 'dining' as ExpenseCategory },
    { title: 'Mobile Load / Package', category: 'subscriptions' as ExpenseCategory },
    { title: 'Medical / Pharmacy', category: 'health' as ExpenseCategory },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Expense Tracker & Budget
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Mess + Daily Spend
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Spending & Expenses
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track your total mess bill alongside daily personal expenses in one unified ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedMonth(getMonthNavigation(selectedMonth, -1))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-2 py-1 text-xs font-semibold rounded-lg bg-transparent text-slate-900 dark:text-white"
            />
            <button
              onClick={() => setSelectedMonth(getMonthNavigation(selectedMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add Button */}
          <button
            id="open-add-expense-btn"
            onClick={() => {
              if (isFormOpen && !editingId) {
                setIsFormOpen(false);
              } else {
                handleResetForm();
                setIsFormOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={() => exportCombinedExpensesToCSV(effectiveMealRecords, safeDailyExpenses, selectedMonth)}
            title="Download full monthly expense spreadsheet"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Full CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Pocket Money & Budget Overview */}
      {onSavePocketMoney && (
        <PocketMoneyCard
          selectedMonth={selectedMonth}
          monthName={combinedSummary.monthName}
          pocketMoney={pocketMoney}
          onSavePocketMoney={onSavePocketMoney}
          grandTotalSpent={combinedSummary.grandTotal}
          messTotalSpent={combinedSummary.messTotal}
          otherExpensesTotalSpent={combinedSummary.otherExpensesTotal}
        />
      )}

      {/* Primary Financial Overview: 3 High-Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grand Total Spent */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-5 rounded-3xl border border-amber-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            <span>Total Monthly Spend</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(combinedSummary.grandTotal)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {combinedSummary.totalTransactions} transactions
            </span>
            <span>•</span>
            <span>Mess + Other Expenses</span>
          </div>
        </div>

        {/* Mess Food Bill Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Mess Food Bill</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              {combinedSummary.messPercentage}% of total
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(combinedSummary.messTotal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Breakfast, Lunch & Dinner</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {effectiveMealRecords.filter((r) => r && r.date && r.date.startsWith(selectedMonth)).length} days logged
            </span>
          </p>
        </div>

        {/* Daily & Personal Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Daily Personal Expenses</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {combinedSummary.otherPercentage}% of total
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(combinedSummary.otherExpensesTotal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Groceries, travel, bills & misc</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {monthDailyExpenses.length} items logged
            </span>
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="flex items-center gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold shadow-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="flex-1">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Expense Form (Animated Accordion) */}
      {isFormOpen && (
        <div
          id="expense-form-card"
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-amber-300 dark:border-amber-700/60 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Daily Expense' : 'Add New Daily Expense'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log personal spending outside the mess (travel, snacks, stationary, bills)
                </p>
              </div>
            </div>
            <button
              onClick={handleResetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Quick Suggestions Chips */}
          {!editingId && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(item.title);
                      setCategory(item.category);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200/60 dark:border-slate-700 transition-colors"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Item / Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notebooks, Laundry, Evening Coffee, Bus Pass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
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
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {/* Quick Add Amount Chips */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[50, 100, 200, 500].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(amount) || 0;
                        setAmount((current + inc).toString());
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      +{inc}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Category Pill Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as (ExpenseCategory | 'mess_food')[])
                  .filter((cat) => cat !== 'mess_food')
                  .map((catKey) => {
                    const cat = catKey as ExpenseCategory;
                    const cfg = CATEGORY_CONFIG[cat];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{cfg.emoji}</span>
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['Cash', 'Easypaisa', 'JazzCash', 'SadaPay', 'NayaPay', 'Bank Transfer', 'Card', 'Other'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center truncate ${
                        paymentMethod === method
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {method === 'Bank Transfer' ? 'Bank / Raast' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Note / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Easypaisa, JazzCash, or canteen cash"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingId ? 'Update Expense' : 'Save Expense'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* "Where Did Your Money Go?" Visual Analytics Report */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <span>Where Did Your Money Go? ({combinedSummary.monthName})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of food mess charges vs. personal daily expenditures
            </p>
          </div>
          {combinedSummary.highestCategory && (
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
              Highest spend: <strong>{combinedSummary.highestCategory.label}</strong> ({combinedSummary.highestCategory.percentage}%)
            </div>
          )}
        </div>

        {/* Multi-Segment Proportional Spending Bar */}
        {combinedSummary.grandTotal > 0 ? (
          <div className="space-y-2">
            <div className="h-5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
              {combinedSummary.categories.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    width: `${Math.max(cat.percentage, 2)}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full transition-all hover:opacity-80"
                  title={`${cat.label}: ${formatCurrency(cat.amount)} (${cat.percentage}%)`}
                />
              ))}
            </div>

            {/* Micro Category Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
              {combinedSummary.categories.map((cat) => (
                <div key={cat.category} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>
                    {cat.label} ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
            No spending recorded yet for {combinedSummary.monthName}.
          </div>
        )}

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {combinedSummary.categories.map((cat) => {
            const isFilterActive = filterCategory === cat.category;
            return (
              <div
                key={cat.category}
                onClick={() => {
                  if (cat.category !== 'mess_food') {
                    setFilterCategory(isFilterActive ? 'all' : cat.category);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all ${
                  cat.category !== 'mess_food' ? 'cursor-pointer' : ''
                } ${
                  isFilterActive
                    ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="p-2 rounded-xl text-white text-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      {getCategoryIcon(cat.iconName)}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {cat.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cat.count} {cat.category === 'mess_food' ? 'days' : 'entries'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Spent</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Expenses Ledger & History */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search, Filter & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search daily expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category Filter dropdown on small screens */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[])
                .filter((cat) => cat !== ('mess_food' as any))
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sort: {sortBy === 'date' ? 'Latest Date' : 'Highest Amount'}
            </button>

            <button
              onClick={() => exportDailyExpensesToCSV(monthDailyExpenses, selectedMonth)}
              disabled={monthDailyExpenses.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {displayedExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {displayedExpenses.map((item) => {
              const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
              const dateInfo = formatDisplayDate(item.date);
              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Category Icon Badge */}
                    <div
                      className="p-2.5 rounded-2xl text-white shadow-xs shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {getCategoryIcon(cfg.iconName, 'w-4 h-4')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {item.paymentMethod || 'Cash'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{dateInfo.formatted}</span>
                        {dateInfo.relative && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {dateInfo.relative}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{cfg.label}</span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px]">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        title="Edit expense"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense "${item.title}" (${formatCurrency(item.amount)})?`)) {
                            onDeleteExpense(item.id);
                          }
                        }}
                        title="Delete expense"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-500 mb-2">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No daily expenses found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : `Add snacks, travel, books, or bills to track where your money went in ${combinedSummary.monthName}.`}
            </p>
            <button
              onClick={() => {
                handleResetForm();
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Expense</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
