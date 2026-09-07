# 💳 Expense & Mess Tracker (`expense-mess-tracker`)

A modern, responsive, and cross-device expense tracker tailored for students, hostelers, and professionals to seamlessly track **daily mess/food bills**, **personal everyday expenses**, and **monthly pocket money budgets**.

🌐 **Live Demo:** [https://expense-mess-tracker.netlify.app/](https://expense-mess-tracker.netlify.app/)  
📂 **GitHub Repository:** [https://github.com/your-username/expense-mess-tracker](https://github.com/your-username/expense-mess-tracker) *(replace with your GitHub profile link)*

---

## 🚀 Key Features

### 1. 🍲 Mess & Meal Expense Tracker
- **Meal-by-Meal Logging:** Record individual costs for Breakfast, Lunch, and Dinner for every calendar date.
- **Auto Daily & Monthly Totals:** Instantly calculates your daily food expenditure and aggregate mess bill for the month.
- **Multiple Mess Ledgers:** Manage multiple food ledgers (e.g., Hostel Mess, College Canteen, Work Cafeteria) with custom names and icons.

### 2. 💸 General Daily Expenses
- **Categorized Spending:** Log personal expenses with predefined categories (Groceries, Rent, Utilities, Transport, Entertainment, Healthcare, Education, etc.).
- **Payment Method Tracking:** Tag transactions with payment modes such as UPI / Online, Cash, Debit/Credit Card, or Bank Transfer.
- **Filter & Search:** Filter transactions by category or search through your expense records.

### 3. 🎯 Pocket Money & Budgeting
- **Monthly Budget Targets:** Set your monthly allowance or pocket money goal.
- **Live Spending Pace:** Real-time visual progress bar showing amount spent, remaining budget, and recommended daily burn rate.
- **Budget Health Warnings:** Visual indicators when nearing or exceeding monthly budget limits.

### 4. 📊 Analytics, Reports & Export
- **Interactive Visual Charts:** Category breakdown and daily spending trends powered by Recharts.
- **Summary Reports:** High-level metrics showing average daily spend, top spending category, and total monthly outlays.
- **Data Export:** One-click CSV export and print-ready receipts/summaries for sharing with parents or roommates.

### 5. ☁️ Real-time Cloud Sync & Offline-First
- **Seamless Cross-Device Sync:** Powered by Firebase Authentication and Cloud Firestore — log on your PC and view instantly on your phone.
- **Offline Persistence:** Works completely offline with local storage fallbacks; automatically syncs when reconnected.
- **One-Click Manual Sync:** Dedicated "Sync Cloud" control to ensure PC and mobile devices stay in 100% parity.

### 6. 🌓 Modern UI & Mobile Friendly
- **Light & Dark Mode:** Handcrafted dark and light color palettes for low-light dorm rooms and bright outdoor screens.
- **Touch-Optimized:** Designed mobile-first with quick touch targets, smooth transitions, and responsive navigation.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Data Visualization:** Recharts
- **Database & Auth:** Firebase Firestore, Firebase Authentication
- **Hosting & Deployment:** Netlify / Cloud Run

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/expense-mess-tracker.git
   cd expense-mess-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔒 Security Rules (Firestore)

The application includes production-ready Firestore security rules in `firestore.rules`, ensuring that every user's meal ledgers, daily transactions, and pocket money budgets are restricted to their authenticated user ID (`isOwner(userId)`).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/expense-mess-tracker/issues).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
