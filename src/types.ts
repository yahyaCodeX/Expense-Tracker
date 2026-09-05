export interface ExpenseRecord {
  date: string; // YYYY-MM-DD
  breakfast: number;
  lunch: number;
  dinner: number;
  dailyTotal: number;
  messId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'groceries'
  | 'transport'
  | 'academics'
  | 'housing'
  | 'dining'
  | 'shopping'
  | 'subscriptions'
  | 'health'
  | 'other';

export type PaymentMethod =
  | 'Easypaisa'
  | 'JazzCash'
  | 'SadaPay'
  | 'NayaPay'
  | 'Raast'
  | 'Cash'
  | 'Bank Transfer'
  | 'Card'
  | 'Other'
  | 'UPI'
  | 'NetBanking';

export interface DailyExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessLedger {
  id: string;
  name: string;
  description?: string;
  monthlyBudget?: number;
  icon?: string;
  color?: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface MonthSummary {
  monthKey: string; // YYYY-MM
  monthName: string; // "September 2026"
  totalBill: number;
  daysRecorded: number;
  averagePerDay: number;
  totalMeals: number;
  breakfastTotal: number;
  lunchTotal: number;
  dinnerTotal: number;
  highestDay?: { date: string; amount: number } | null;
  lowestDay?: { date: string; amount: number } | null;
  skippedBreakfastCount: number;
  skippedLunchCount: number;
  skippedDinnerCount: number;
}

export interface CategoryBreakdown {
  category: ExpenseCategory | 'mess_food';
  label: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  bgColor: string;
  iconName: string;
}

export interface CombinedMonthSummary {
  monthKey: string;
  monthName: string;
  grandTotal: number;
  messTotal: number;
  otherExpensesTotal: number;
  messPercentage: number;
  otherPercentage: number;
  categories: CategoryBreakdown[];
  highestCategory: CategoryBreakdown | null;
  totalTransactions: number;
  pocketMoney?: number;
  remainingBalance?: number;
  spentPercentage?: number;
  isOverBudget?: boolean;
}

export interface MonthlyPocketMoney {
  monthKey: string;
  amount: number;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
}

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}
