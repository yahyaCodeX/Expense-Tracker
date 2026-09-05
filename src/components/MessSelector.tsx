import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { MessLedger, UserProfile } from '../types';
import { createMessLedger, deleteMessLedger } from '../lib/firebase';
import { formatCurrency } from '../lib/calculations';

interface MessSelectorProps {
  user: UserProfile;
  messes: MessLedger[];
  activeMessId: string;
  onSelectMess: (messId: string) => void;
  monthlyTotalBill?: number;
}

const ICONS = ['🍲', '🍛', '🍱', '🥘', '🥣', '☕', '🍕', '🥗', '🍔', '🥪'];
const QUICK_SUGGESTIONS = [
  { name: 'Hostel Mess', icon: '🍲' },
  { name: 'College Canteen', icon: '🍱' },
  { name: 'Tiffin Service', icon: '🍛' },
  { name: 'Night Cafe', icon: '☕' },
  { name: 'Flat / PG Kitchen', icon: '🥘' },
];

export const MessSelector: React.FC<MessSelectorProps> = ({
  user,
  messes = [],
  activeMessId,
  onSelectMess,
  monthlyTotalBill = 0,
}) => {
  const safeMesses = Array.isArray(messes) ? messes : [];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMessName, setNewMessName] = useState('');
  const [newMessDesc, setNewMessDesc] = useState('');
  const [newMessBudget, setNewMessBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍲');
  const [selectedColor, setSelectedColor] = useState('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmMess, setDeleteConfirmMess] = useState<MessLedger | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setFormError(null);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isAddModalOpen]);

  const activeMess = safeMesses.find((m) => m.id === activeMessId) || safeMesses[0] || {
    id: 'default',
    name: 'Main Mess',
    icon: '🍲',
    color: 'amber',
  };

  const handleOpenModal = () => {
    setNewMessName('');
    setNewMessDesc('');
    setNewMessBudget('');
    setSelectedIcon('🍲');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleApplySuggestion = (suggestion: { name: string; icon: string }) => {
    setNewMessName(suggestion.name);
    setSelectedIcon(suggestion.icon);
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newMessName.trim();
    if (!trimmedName) {
      setFormError('Please enter a mess name (e.g. Boys Hostel Mess, Tiffin Service)');
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const budgetNum = newMessBudget.trim() ? Number(newMessBudget) : undefined;
      const created = await createMessLedger(
        user.uid,
        {
          name: trimmedName,
          description: newMessDesc.trim() || undefined,
          monthlyBudget: budgetNum && !isNaN(budgetNum) ? budgetNum : undefined,
          icon: selectedIcon || '🍲',
          color: selectedColor || 'amber',
        },
        user
      );

      setNewMessName('');
      setNewMessDesc('');
      setNewMessBudget('');
      setIsAddModalOpen(false);
      onSelectMess(created.id);
    } catch (err: unknown) {
      console.error('Failed to create mess ledger:', err);
      const msg = err instanceof Error ? err.message : 'Could not create mess ledger. Please try again.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mess: MessLedger) => {
    try {
      await deleteMessLedger(user.uid, mess.id, user);
      setDeleteConfirmMess(null);
      // If deleted active mess, switch to default or first remaining mess
      if (mess.id === activeMessId) {
        const remaining = safeMesses.filter((m) => m.id !== mess.id);
        if (remaining.length > 0) {
          onSelectMess(remaining[0].id);
        } else {
          onSelectMess('default');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete mess';
      alert(msg);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile & Desktop Header Mess Switcher */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[200px]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
            Mess Ledger:
          </span>

          {/* Quick Mess Chips for smooth 1-tap switching */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
            {messes.map((mess) => {
              const isActive = mess.id === activeMessId;
              return (
                <button
                  key={mess.id}
                  type="button"
                  onClick={() => onSelectMess(mess.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer touch-manipulation min-h-[40px] ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs scale-100 ring-2 ring-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{mess.icon || '🍲'}</span>
                  <span>{mess.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5" />}
                </button>
              );
            })}

            {/* Plus (+) Button to Add Mess */}
            <button
              id="add-new-mess-button"
              type="button"
              onClick={handleOpenModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation min-h-[40px] shrink-0 shadow-xs active:scale-95"
              title="Add another mess ledger (Hostel, Cafeteria, Tiffin, etc.)"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="font-extrabold">Add Mess</span>
            </button>
          </div>
        </div>

        {/* Active Mess Info & Actions */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">This Month</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(monthlyTotalBill)}
            </span>
          </div>

          {/* Delete mess button (only for non-default messes) */}
          {activeMess.id !== 'default' && (
            <button
              type="button"
              onClick={() => setDeleteConfirmMess(activeMess)}
              title={`Delete ${activeMess.name}`}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors touch-manipulation cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal: Add New Mess Ledger */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsAddModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold shadow-xs">
                {selectedIcon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add New Mess Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track separate monthly bills (e.g. Cafeteria, Tiffin, Canteen)
                </p>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleApplySuggestion(item)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message banner */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Mess Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Boys Hostel Mess, Tiffin Service"
                  value={newMessName}
                  onChange={(e) => {
                    setNewMessName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors ${
                    formError && !newMessName.trim()
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B 2nd floor, dinner only"
                  value={newMessDesc}
                  onChange={(e) => setNewMessDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Monthly Budget (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 5000"
                    value={newMessBudget}
                    onChange={(e) => setNewMessBudget(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Choose Icon
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer shrink-0 touch-manipulation ${
                        selectedIcon === emoji
                          ? 'bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500 scale-105 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-mess-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Create Mess Ledger</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Mess */}
      {deleteConfirmMess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Delete "{deleteConfirmMess.name}"?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              All meal expenses logged under this mess ledger will also be deleted. This cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMess(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmMess)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer min-h-[44px]"
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
