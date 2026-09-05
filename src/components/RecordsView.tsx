import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  Pencil,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  AlertTriangle
} from 'lucide-react';
import { ExpenseRecord, MonthSummary } from '../types';
import {
  formatCurrency,
  exportMonthlyRecordsToCSV,
  getMonthNavigation,
  formatDisplayDate
} from '../lib/calculations';

interface RecordsViewProps {
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  monthSummary: MonthSummary;
  allRecords: ExpenseRecord[];
  onEditRecord: (date: string) => void;
  onDeleteRecord: (date: string) => void;
  activeMessName?: string;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  selectedMonth,
  setSelectedMonth,
  monthSummary,
  allRecords = [],
  onEditRecord,
  onDeleteRecord,
  activeMessName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(null);

  // Filter records by selected month and search term
  const safeRecords = Array.isArray(allRecords) ? allRecords : [];
  const monthlyRecords = safeRecords.filter((r) => r && r.date && r.date.startsWith(selectedMonth));
  const filteredRecords = monthlyRecords.filter((r) => {
    if (!searchTerm) return true;
    return r.date.includes(searchTerm);
  });

  const handleExportCSV = () => {
    exportMonthlyRecordsToCSV(safeRecords, selectedMonth);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmDate) {
      onDeleteRecord(deleteConfirmDate);
      setDeleteConfirmDate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Expense Records
            </span>
            {activeMessName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                {activeMessName}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Monthly Records: {monthSummary.monthName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total {monthlyRecords.length} days recorded • Total bill {formatCurrency(monthSummary.totalBill)}
          </p>
        </div>

        {/* Month Selector & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
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
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={monthlyRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by date (e.g. 05)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing {filteredRecords.length} of {monthlyRecords.length} records
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4">
            <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No records found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {monthlyRecords.length === 0
                ? `No meals have been recorded for ${monthSummary.monthName}. Go to Dashboard to add records.`
                : 'No records matched your search query.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< sm) */}
            <div className="sm:hidden p-4 space-y-3">
              {filteredRecords.map((r) => {
                const daily = r.dailyTotal || (r.breakfast + r.lunch + r.dinner);
                const isHighest = monthSummary.highestDay?.date === r.date && daily > 0;
                const isLowest = monthSummary.lowestDay?.date === r.date && daily > 0;
                const { formatted, relative } = formatDisplayDate(r.date);

                return (
                  <div
                    key={r.date}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatted}
                          </span>
                          {relative && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              {relative}
                            </span>
                          )}
                          {isHighest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              Highest
                            </span>
                          )}
                          {isLowest && !isHighest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Lowest
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{r.date}</span>
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
                          {r.breakfast > 0 ? formatCurrency(r.breakfast) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lunch</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {r.lunch > 0 ? formatCurrency(r.lunch) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Dinner</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {r.dinner > 0 ? formatCurrency(r.dinner) : <span className="text-slate-400 text-[11px]">Skipped</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={() => onEditRecord(r.date)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-amber-600 touch-manipulation min-h-[36px]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmDate(r.date)}
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

            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Breakfast</th>
                    <th className="py-3.5 px-4">Lunch</th>
                    <th className="py-3.5 px-4">Dinner</th>
                    <th className="py-3.5 px-4 text-right">Daily Total</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {filteredRecords.map((r) => {
                    const daily = r.dailyTotal || (r.breakfast + r.lunch + r.dinner);
                    const isHighest = monthSummary.highestDay?.date === r.date && daily > 0;
                    const isLowest = monthSummary.lowestDay?.date === r.date && daily > 0;
                    const { formatted, relative } = formatDisplayDate(r.date);

                    return (
                      <tr
                        key={r.date}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatted}
                            </span>
                            {relative && (
                              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                {relative}
                              </span>
                            )}
                            {isHighest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                Highest
                              </span>
                            )}
                            {isLowest && !isHighest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Lowest
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block font-mono mt-0.5">{r.date}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {r.breakfast > 0 ? (
                            formatCurrency(r.breakfast)
                          ) : (
                            <span className="text-xs text-slate-400 italic">Rs. 0 (Skipped)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.lunch > 0 ? (
                            formatCurrency(r.lunch)
                          ) : (
                            <span className="text-xs text-slate-400 italic">Rs. 0 (Skipped)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.dinner > 0 ? (
                            formatCurrency(r.dinner)
                          ) : (
                            <span className="text-xs text-slate-400 italic">Rs. 0 (Skipped)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(daily)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onEditRecord(r.date)}
                              title="Edit this record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmDate(r.date)}
                              title="Delete this record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Expense Record?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
              Are you sure you want to delete the meal record for{' '}
              <strong className="text-slate-900 dark:text-white">{deleteConfirmDate}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmDate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
