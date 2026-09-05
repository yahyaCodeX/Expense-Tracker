import { ExpenseRecord, MonthSummary, DailyExpenseItem, ExpenseCategory, CombinedMonthSummary, CategoryBreakdown } from '../types';

export const CATEGORY_CONFIG: Record<
  ExpenseCategory | 'mess_food',
  { label: string; iconName: string; color: string; bgColor: string; borderColor: string; emoji: string }
> = {
  mess_food: {
    label: 'Mess Food Bill',
    iconName: 'Utensils',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800',
    emoji: '🍲',
  },
  groceries: {
    label: 'Groceries & Snacks',
    iconName: 'ShoppingBag',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    emoji: '🛒',
  },
  transport: {
    label: 'Travel & Commute',
    iconName: 'Bus',
    color: '#0284c7',
    bgColor: 'bg-sky-600',
    borderColor: 'border-sky-200 dark:border-sky-800',
    emoji: '🚌',
  },
  academics: {
    label: 'Books & Academics',
    iconName: 'BookOpen',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-200 dark:border-purple-800',
    emoji: '📚',
  },
  housing: {
    label: 'Hostel & Rent / Utilities',
    iconName: 'Home',
    color: '#ec4899',
    bgColor: 'bg-pink-500',
    borderColor: 'border-pink-200 dark:border-pink-800',
    emoji: '🏠',
  },
  dining: {
    label: 'Cafe & Eating Out',
    iconName: 'Coffee',
    color: '#ea580c',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-200 dark:border-orange-800',
    emoji: '☕',
  },
  shopping: {
    label: 'Personal & Shopping',
    iconName: 'Shirt',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    emoji: '🛍️',
  },
  subscriptions: {
    label: 'Mobile & Subscriptions',
    iconName: 'Smartphone',
    color: '#6366f1',
    bgColor: 'bg-indigo-500',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    emoji: '📱',
  },
  health: {
    label: 'Health & Pharmacy',
    iconName: 'HeartPulse',
    color: '#e11d48',
    bgColor: 'bg-rose-600',
    borderColor: 'border-rose-200 dark:border-rose-800',
    emoji: '💊',
  },
  other: {
    label: 'Miscellaneous',
    iconName: 'Tag',
    color: '#64748b',
    bgColor: 'bg-slate-500',
    borderColor: 'border-slate-200 dark:border-slate-800',
    emoji: '💡',
  },
};

export function formatCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function getMonthKeyFromDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  return dateStr.slice(0, 7);
}

export function formatMonthName(yearMonth: string): string {
  // yearMonth is YYYY-MM
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): { formatted: string; relative: string | null } {
  // dateStr is YYYY-MM-DD
  const today = getTodayDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yYear = yesterdayDate.getFullYear();
  const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayDate.getDate()).padStart(2, '0');
  const yesterday = `${yYear}-${yMonth}-${yDay}`;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const d = new Date(year, month - 1, day);
  const formatted = isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  let relative: string | null = null;
  if (dateStr === today) {
    relative = 'Today';
  } else if (dateStr === yesterday) {
    relative = 'Yesterday';
  }

  return { formatted, relative };
}

export function computeMonthSummary(records: ExpenseRecord[] = [], yearMonth: string = ''): MonthSummary {
  const safeRecords = Array.isArray(records) ? records : [];
  const filtered = safeRecords.filter((r) => r && r.date && r.date.startsWith(yearMonth));

  let totalBill = 0;
  let breakfastTotal = 0;
  let lunchTotal = 0;
  let dinnerTotal = 0;
  let totalMeals = 0;
  let skippedBreakfastCount = 0;
  let skippedLunchCount = 0;
  let skippedDinnerCount = 0;

  let highestDay: { date: string; amount: number } | null = null;
  let lowestDay: { date: string; amount: number } | null = null;

  filtered.forEach((r) => {
    const b = Number(r.breakfast) || 0;
    const l = Number(r.lunch) || 0;
    const d = Number(r.dinner) || 0;
    const daily = Number(r.dailyTotal) || (b + l + d);

    totalBill += daily;
    breakfastTotal += b;
    lunchTotal += l;
    dinnerTotal += d;

    if (b > 0) totalMeals += 1;
    else skippedBreakfastCount += 1;

    if (l > 0) totalMeals += 1;
    else skippedLunchCount += 1;

    if (d > 0) totalMeals += 1;
    else skippedDinnerCount += 1;

    if (!highestDay || daily > highestDay.amount) {
      highestDay = { date: r.date, amount: daily };
    }
    // For lowest active spending day: prioritize lowest non-zero day, or lowest overall if all are 0
    if (daily > 0) {
      if (!lowestDay || lowestDay.amount === 0 || daily < lowestDay.amount) {
        lowestDay = { date: r.date, amount: daily };
      }
    } else if (!lowestDay) {
      lowestDay = { date: r.date, amount: 0 };
    }
  });

  const daysRecorded = filtered.length;
  const averagePerDay = daysRecorded > 0 ? Math.round(totalBill / daysRecorded) : 0;

  return {
    monthKey: yearMonth,
    monthName: formatMonthName(yearMonth),
    totalBill,
    daysRecorded,
    averagePerDay,
    totalMeals,
    breakfastTotal,
    lunchTotal,
    dinnerTotal,
    highestDay,
    lowestDay,
    skippedBreakfastCount,
    skippedLunchCount,
    skippedDinnerCount,
  };
}

export function exportMonthlyRecordsToCSV(records: ExpenseRecord[] = [], yearMonth: string = '') {
  const safeRecords = Array.isArray(records) ? records : [];
  const filtered = safeRecords
    .filter((r) => r && r.date && r.date.startsWith(yearMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const headers = ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Daily Total'];
  const rows = filtered.map((r) => [
    r.date,
    r.breakfast,
    r.lunch,
    r.dinner,
    r.dailyTotal || (r.breakfast + r.lunch + r.dinner),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Expenses_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getMonthNavigation(currentYearMonth: string, offset: number): string {
  const [year, month] = (currentYearMonth || '').split('-').map(Number);
  if (!year || !month) return currentYearMonth;
  const date = new Date(year, month - 1 + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export function computeCombinedMonthSummary(
  mealRecords: ExpenseRecord[] = [],
  dailyExpenses: DailyExpenseItem[] = [],
  yearMonth: string = '',
  pocketMoney: number = 0
): CombinedMonthSummary {
  const safeMealRecords = Array.isArray(mealRecords) ? mealRecords : [];
  const safeDailyExpenses = Array.isArray(dailyExpenses) ? dailyExpenses : [];
  const messSummary = computeMonthSummary(safeMealRecords, yearMonth);
  const filteredDaily = safeDailyExpenses.filter((e) => e && e.date && e.date.startsWith(yearMonth));

  let otherExpensesTotal = 0;
  const categoryTotals: Record<ExpenseCategory, { amount: number; count: number }> = {
    groceries: { amount: 0, count: 0 },
    transport: { amount: 0, count: 0 },
    academics: { amount: 0, count: 0 },
    housing: { amount: 0, count: 0 },
    dining: { amount: 0, count: 0 },
    shopping: { amount: 0, count: 0 },
    subscriptions: { amount: 0, count: 0 },
    health: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };

  filteredDaily.forEach((item) => {
    const amt = Number(item.amount) || 0;
    otherExpensesTotal += amt;
    const cat = item.category in categoryTotals ? item.category : 'other';
    categoryTotals[cat].amount += amt;
    categoryTotals[cat].count += 1;
  });

  const grandTotal = messSummary.totalBill + otherExpensesTotal;
  const messPercentage = grandTotal > 0 ? Math.round((messSummary.totalBill / grandTotal) * 100) : 0;
  const otherPercentage = grandTotal > 0 ? Math.max(0, 100 - messPercentage) : 0;

  const categories: CategoryBreakdown[] = [];

  // Always include Mess Food Bill if there are meal records or bill > 0
  if (messSummary.totalBill > 0 || messSummary.daysRecorded > 0) {
    categories.push({
      category: 'mess_food',
      label: CATEGORY_CONFIG.mess_food.label,
      amount: messSummary.totalBill,
      percentage: grandTotal > 0 ? Math.round((messSummary.totalBill / grandTotal) * 100) : 0,
      count: messSummary.daysRecorded,
      color: CATEGORY_CONFIG.mess_food.color,
      bgColor: CATEGORY_CONFIG.mess_food.bgColor,
      iconName: CATEGORY_CONFIG.mess_food.iconName,
    });
  }

  // Add individual daily expense categories
  (Object.keys(categoryTotals) as ExpenseCategory[]).forEach((cat) => {
    const data = categoryTotals[cat];
    if (data.amount > 0 || data.count > 0) {
      const cfg = CATEGORY_CONFIG[cat];
      categories.push({
        category: cat,
        label: cfg.label,
        amount: data.amount,
        percentage: grandTotal > 0 ? Math.round((data.amount / grandTotal) * 100) : 0,
        count: data.count,
        color: cfg.color,
        bgColor: cfg.bgColor,
        iconName: cfg.iconName,
      });
    }
  });

  // Sort categories by highest amount spent
  categories.sort((a, b) => b.amount - a.amount);

  const highestCategory = categories.length > 0 ? categories[0] : null;

  const validPocketMoney = Math.max(0, Number(pocketMoney) || 0);
  const remainingBalance = validPocketMoney > 0 ? (validPocketMoney - grandTotal) : 0;
  const spentPercentage = validPocketMoney > 0 ? Math.round((grandTotal / validPocketMoney) * 100) : 0;
  const isOverBudget = validPocketMoney > 0 && grandTotal > validPocketMoney;

  return {
    monthKey: yearMonth,
    monthName: formatMonthName(yearMonth),
    grandTotal,
    messTotal: messSummary.totalBill,
    otherExpensesTotal,
    messPercentage,
    otherPercentage,
    categories,
    highestCategory,
    totalTransactions: messSummary.daysRecorded + filteredDaily.length,
    pocketMoney: validPocketMoney,
    remainingBalance,
    spentPercentage,
    isOverBudget,
  };
}

export function exportDailyExpensesToCSV(dailyExpenses: DailyExpenseItem[] = [], yearMonth: string = '') {
  const safeDaily = Array.isArray(dailyExpenses) ? dailyExpenses : [];
  const filtered = safeDaily
    .filter((r) => r && r.date && r.date.startsWith(yearMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const headers = ['Date', 'Title', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const rows = filtered.map((r) => [
    r.date,
    `"${(r.title || '').replace(/"/g, '""')}"`,
    CATEGORY_CONFIG[r.category]?.label || r.category,
    r.amount,
    r.paymentMethod || 'Cash',
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Daily_Expenses_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCombinedExpensesToCSV(
  mealRecords: ExpenseRecord[] = [],
  dailyExpenses: DailyExpenseItem[] = [],
  yearMonth: string = ''
) {
  const safeMeals = Array.isArray(mealRecords) ? mealRecords : [];
  const safeDaily = Array.isArray(dailyExpenses) ? dailyExpenses : [];

  const filteredMeals = safeMeals
    .filter((r) => r && r.date && r.date.startsWith(yearMonth))
    .map((m) => ({
      date: m.date,
      type: 'Mess Food',
      title: `Daily Mess Meals (B: Rs. ${m.breakfast}, L: Rs. ${m.lunch}, D: Rs. ${m.dinner})`,
      category: 'Mess Food Bill',
      amount: m.dailyTotal || (m.breakfast + m.lunch + m.dinner),
    }));

  const filteredDaily = safeDaily
    .filter((e) => e && e.date && e.date.startsWith(yearMonth))
    .map((e) => ({
      date: e.date,
      type: 'Personal Expense',
      title: e.title,
      category: CATEGORY_CONFIG[e.category]?.label || e.category,
      amount: e.amount,
    }));

  const combined = [...filteredMeals, ...filteredDaily].sort((a, b) => b.date.localeCompare(a.date));

  const headers = ['Date', 'Type', 'Description', 'Category', 'Amount'];
  const rows = combined.map((r) => [
    r.date,
    r.type,
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${r.category}"`,
    r.amount,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Complete_Budget_Summary_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
