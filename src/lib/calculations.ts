import { ExpenseRecord, MonthSummary } from '../types';

export function formatCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
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

export function computeMonthSummary(records: ExpenseRecord[], yearMonth: string): MonthSummary {
  const filtered = records.filter((r) => r.date.startsWith(yearMonth));

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

export function exportMonthlyRecordsToCSV(records: ExpenseRecord[], yearMonth: string) {
  const filtered = records
    .filter((r) => r.date.startsWith(yearMonth))
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
  link.setAttribute('download', `MessMate_Expenses_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getMonthNavigation(currentYearMonth: string, offset: number): string {
  const [year, month] = currentYearMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}
