# Premier Consolidated Capital Holdings (Web App)

## Overview

A financial management web app for university students. Helps students track lump-sum disbursements (e.g., HELB), log expenses, monitor budgets, and manage money via M-Pesa in a simple, intuitive dashboard.

## Problem

Students often struggle to manage large disbursements, leading to overspending and financial stress.

## Solution / MVP

* Register/Login with email/password
* Send money to wallet via M-Pesa (Daraja C2B)
* Withdraw money back to M-Pesa (Daraja B2C)
* Log expenses by category (Accommodation, Food, Transport, etc.)
* Monitor budget limits per category
* Track remaining balance in real-time
* View expense history and activity
* Simple, intuitive dashboard showing balance and spending

## Tech Stack

* **Frontend:** React + Vite + JSX
* **State Management:** React Context
* **Routing:** React Router
* **Styling:** CSS + theme variables
* **Font:** Roboto
* **Backend:** Django REST Framework
* **Payments:** M-Pesa Daraja API (Sandbox)

## Theme / Design

* **Primary:** #3A86FF | **Accent:** #3AE8FF | **Secondary:** #513AFF
* **Background:** #F7F9FC
* Clean, minimalist, student-friendly UI
* Rounded cards/buttons, clear hierarchy, soft alerts

## Folder Structure

```
src/
├─ main.jsx / App.jsx          # App entrypoint
├─ pages/                      # Screens
│  ├─ login.jsx               # Login screen
│  ├─ signup.jsx              # Registration screen
│  ├─ Dashboard.jsx           # Main dashboard (balance, quick actions)
│  ├─ AddExpense.jsx          # Add new expense
│  └─ Activity.jsx            # Expense history & transactions
├─ components/                 # Reusable UI components
│  ├─ DepositModal.jsx        # M-Pesa deposit UI
│  ├─ WithdrawalModal.jsx     # M-Pesa withdrawal UI
│  ├─ BalanceCard.jsx         # Balance display
│  ├─ BottomNav.jsx           # Navigation
│  ├─ CategoryCard.jsx        # Expense category card
│  └─ ExpenseKeypad.jsx       # Quick expense entry
├─ services/                   # Business logic
│  └─ api.js                  # API calls to backend
├─ styles/                     # CSS stylesheets
│  ├─ login.css
│  ├─ dashboard.css
│  ├─ addExpense.css
│  ├─ deposit.css
│  ├─ withdrawal.css
│  └─ ...
└─ utils/                      # Helpers
   └─ budgetStore.js          # Budget calculations
```

## Key Features

1. **User Authentication**
   - Email/password registration
   - Secure login with token storage
   - Profile management

2. **Wallet Management**
   - Real-time balance display
   - M-Pesa deposit (C2B)
   - M-Pesa withdrawal (B2C)
   - Transaction history

3. **Expense Tracking**
   - Log expenses by category
   - Category-based budget limits
   - Visual progress bars
   - Spending guidelines

4. **Budget Monitoring**
   - Per-category budget limits
   - Spending alerts
   - Budget status dashboard

5. **Payment Integration**
   - M-Pesa C2B deposits (sandbox)
   - M-Pesa B2C withdrawals (sandbox)
   - Real-time transaction status
   - Success/error notifications
└─ styles/     # CSS / theme
```

## Getting Started

```bash
git clone https://github.com/munenesylvia020-source/Munene-Sylvia.git
cd premier_capital_web
npm install
npm run dev

```

## Future Enhancements

* Real investment / MMF integration
* Notifications for budget thresholds
* Dark mode
* Backend authentication
* Exportable reports

