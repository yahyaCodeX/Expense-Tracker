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
