import React from 'react';
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
  PieChart
} from 'lucide-react';
import { ExpenseRecord, MonthSummary } from '../types';
import {
  formatCurrency,
  exportMonthlyRecordsToCSV,
  getMonthNavigation
} from '../lib/calculations';

interface ReportsViewProps {
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  monthSummary: MonthSummary;
  allRecords: ExpenseRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  selectedMonth,
  setSelectedMonth,
  monthSummary,
  allRecords,
}) => {
  const monthlyRecords = allRecords
    .filter((r) => r.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological for charts

  // Calculate percentages
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Analytical Reports
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Mess Expense Report: {monthSummary.monthName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spending patterns, meal breakdown, and daily analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => exportMonthlyRecordsToCSV(allRecords, selectedMonth)}
            disabled={monthlyRecords.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
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
