# Premier Consolidated Capital Holdings (Web App)


## Overview

A financial management web app for university students. Helps students track lump-sum disbursements (e.g., HELB), allocate budgets, log expenses, and monitor remaining balances in a simple, intuitive dashboard.


## Problem

Students often struggle to manage large disbursements, leading to overspending and financial stress.


## Solution / MVP

* Register/Login
* Enter lump-sum funds
* Automatic budget allocation (Rent, Food, Tuition, Personal, Savings)
* Dashboard showing remaining balance and category progress
* Log expenses quickly
* Visual progress bars to track spending


## Tech Stack

* **Frontend:** React + Vite
* **State Management:** React Context
* **Routing:** React Router
* **Styling:** CSS + theme variables
* **Font:** Roboto


## Theme / Design

* **Primary:** #3A86FF | **Accent:** #3AE8FF | **Secondary:** #513AFF
* **Background:** #F7F9FC
* Clean, minimalist, student-friendly UI
* Rounded cards/buttons, clear hierarchy, soft alerts


## Folder Structure (Simplified)

```
src/
├─ main.jsx / App.jsx
├─ pages/      # Screens (Login, Dashboard, AddExpense, Settings)
├─ components/ # Reusable UI components
├─ context/    # State management
├─ services/   # Business logic
├─ utils/      # Helpers/constants
└─ styles/     # CSS / theme
```

## Getting Started

```bash
git clone https://github.com/munenesylvia020-source/Munene-Sylvia.git
cd Munene-Sylvia
npm install
npm run dev

```

## Future Enhancements

* Real investment / MMF integration
* Notifications for budget thresholds
* Dark mode
* Backend authentication
* Exportable reports

