import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowDownRight,
  Coffee,
  Utensils,
  Soup,
  Download,
  PieChart,
  Wallet,
  ShoppingBag,
  Bus,
  BookOpen,
  Home,
  Shirt,
  Smartphone,
  HeartPulse,
  Tag
} from 'lucide-react';
import { ExpenseRecord, MonthSummary, DailyExpenseItem, ExpenseCategory } from '../types';
import {
  formatCurrency,
  exportMonthlyRecordsToCSV,
  exportCombinedExpensesToCSV,
  getMonthNavigation,
  computeCombinedMonthSummary,
  CATEGORY_CONFIG
} from '../lib/calculations';
import { PocketMoneyCard } from './PocketMoneyCard';

interface ReportsViewProps {
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  monthSummary: MonthSummary;
  allRecords: ExpenseRecord[];
  dailyExpenses?: DailyExpenseItem[];
  pocketMoney?: number;
  onSavePocketMoney?: (amount: number) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  selectedMonth,
  setSelectedMonth,
  monthSummary,
  allRecords = [],
  dailyExpenses = [],
  pocketMoney = 0,
  onSavePocketMoney,
}) => {
  const [reportMode, setReportMode] = useState<'combined' | 'mess_only'>('combined');

  const safeAllRecords = Array.isArray(allRecords) ? allRecords : [];
  const safeDailyExpenses = Array.isArray(dailyExpenses) ? dailyExpenses : [];

  const combinedSummary = useMemo(() => {
    return computeCombinedMonthSummary(safeAllRecords, safeDailyExpenses, selectedMonth, pocketMoney);
  }, [safeAllRecords, safeDailyExpenses, selectedMonth, pocketMoney]);

  const monthlyRecords = safeAllRecords
    .filter((r) => r && r.date && r.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological for charts

  // Calculate percentages for mess meals
  const bPercent =
    monthSummary.totalBill > 0
      ? Math.round((monthSummary.breakfastTotal / monthSummary.totalBill) * 100)
      : 0;
  const lPercent =
    monthSummary.totalBill > 0
      ? Math.round((monthSummary.lunchTotal / monthSummary.totalBill) * 100)
      : 0;
  const dPercent =
    monthSummary.totalBill > 0
      ? Math.max(0, 100 - bPercent - lPercent)
      : 0;

  // Max daily spending for chart normalization
  const maxDaily = Math.max(
    ...monthlyRecords.map((r) => r.dailyTotal || (r.breakfast + r.lunch + r.dinner)),
    500
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Analytical Reports
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Spending Report: {monthSummary.monthName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive audit of where and how your money was used
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReportMode('combined')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportMode === 'combined'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Spending
            </button>
            <button
              onClick={() => setReportMode('mess_only')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportMode === 'mess_only'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mess Food Only
            </button>
          </div>

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

          <button
            onClick={() => {
              if (reportMode === 'combined') {
                exportCombinedExpensesToCSV(safeAllRecords, safeDailyExpenses, selectedMonth);
              } else {
                exportMonthlyRecordsToCSV(safeAllRecords, selectedMonth);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Pocket Money & Budget Overview in Combined Mode */}
      {reportMode === 'combined' && onSavePocketMoney && (
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

      {/* Primary Metric Cards */}
      {reportMode === 'combined' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Monthly Spend */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Grand Total Spend
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatCurrency(combinedSummary.grandTotal)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {combinedSummary.totalTransactions} transactions in {combinedSummary.monthName}
            </p>
          </div>

          {/* Mess Food Bill */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Mess Food Bill</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{combinedSummary.messPercentage}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatCurrency(combinedSummary.messTotal)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {monthSummary.daysRecorded} days of hostel meals
            </p>
          </div>

          {/* Daily Personal Expenses */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Personal Expenses</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{combinedSummary.otherPercentage}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatCurrency(combinedSummary.otherExpensesTotal)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Groceries, travel, books & bills
            </p>
          </div>

          {/* Top Category */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Top Category</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
              {combinedSummary.highestCategory ? combinedSummary.highestCategory.label : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {combinedSummary.highestCategory
                ? `${formatCurrency(combinedSummary.highestCategory.amount)} (${combinedSummary.highestCategory.percentage}%)`
                : 'No expenses yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Bill */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Monthly Bill
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatCurrency(monthSummary.totalBill)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across {monthSummary.daysRecorded} logged days
            </p>
          </div>

          {/* Average Per Day */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Average Per Day
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {monthSummary.daysRecorded > 0 ? `${formatCurrency(monthSummary.averagePerDay)}` : 'Rs. 0'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Average daily mess expense
            </p>
          </div>

          {/* Highest Spending Day */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Highest Day</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {monthSummary.highestDay ? formatCurrency(monthSummary.highestDay.amount) : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {monthSummary.highestDay ? `On ${monthSummary.highestDay.date}` : 'No records yet'}
            </p>
          </div>

          {/* Lowest Spending Day */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Lowest Day</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {monthSummary.lowestDay ? formatCurrency(monthSummary.lowestDay.amount) : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {monthSummary.lowestDay ? `On ${monthSummary.lowestDay.date}` : 'No records yet'}
            </p>
          </div>
        </div>
      )}

      {/* Where Did Your Money Go? Section in Combined Mode */}
      {reportMode === 'combined' && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <span>Where Did Your Money Go? ({combinedSummary.monthName})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proportional distribution of total budget spent between mess meals and daily categories
            </p>
          </div>

          {combinedSummary.grandTotal > 0 ? (
            <div className="space-y-3">
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
            <p className="text-xs text-slate-400 italic py-2">
              No spending data recorded yet for {combinedSummary.monthName}.
            </p>
          )}

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {combinedSummary.categories.map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
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
            ))}
          </div>
        </div>
      )}

      {/* Meal Breakdown Analysis */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-amber-500" />
          <span>Meal-by-Meal Distribution</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Share of total monthly expense spent on each meal category
        </p>

        {/* Visual Multi-Segment Bar */}
        {monthSummary.totalBill > 0 ? (
          <div className="space-y-4">
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${bPercent}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Breakfast: ${bPercent}%`}
              />
              <div
                style={{ width: `${lPercent}%` }}
                className="bg-orange-500 h-full transition-all"
                title={`Lunch: ${lPercent}%`}
              />
              <div
                style={{ width: `${dPercent}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Dinner: ${dPercent}%`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">
                  <Coffee className="w-4 h-4" />
                  <span>Breakfast ({bPercent}%)</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(monthSummary.breakfastTotal)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {monthSummary.skippedBreakfastCount} mornings skipped
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-slate-800/60 border border-orange-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-800 dark:text-orange-400 mb-1">
                  <Utensils className="w-4 h-4" />
                  <span>Lunch ({lPercent}%)</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(monthSummary.lunchTotal)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {monthSummary.skippedLunchCount} afternoons skipped
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                  <Soup className="w-4 h-4" />
                  <span>Dinner ({dPercent}%)</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(monthSummary.dinnerTotal)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {monthSummary.skippedDinnerCount} nights skipped
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-4">
            No expense data available for this month to calculate meal distribution.
          </p>
        )}
      </div>

      {/* Daily Spending Interactive Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <span>Daily Expense Spending Timeline</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Daily totals throughout {monthSummary.monthName} (Hover over bars to see breakdown)
        </p>

        {monthlyRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No daily expense records found for this month.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-2 sm:gap-3 min-w-[550px] h-48 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
              {monthlyRecords.map((r) => {
                const daily = r.dailyTotal || (r.breakfast + r.lunch + r.dinner);
                const heightPercent = Math.max(8, Math.round((daily / maxDaily) * 100));
                const dayNum = r.date.split('-')[2];

                return (
                  <div
                    key={r.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none">
                      <span className="font-bold">{r.date}</span>
                      <span className="text-amber-400 font-bold">{formatCurrency(daily)}</span>
                      <span className="text-slate-300 text-[9px]">
                        B: Rs. {r.breakfast} • L: Rs. {r.lunch} • D: Rs. {r.dinner}
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-amber-500 group-hover:bg-amber-600 transition-all flex items-end justify-center pb-1"
                    />

                    {/* Day label */}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 pt-2 px-2">
              <span>Beginning of Month</span>
              <span>Daily Mess Costs (Rs.)</span>
              <span>End of Month</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
