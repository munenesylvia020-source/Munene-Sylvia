# Premier Consolidated Capital Holdings (Web App)


## Overview

A financial management web app for university students. Helps students track lump-sum disbursements (e.g., HELB), allocate budgets, log expenses, and monitor remaining balances in a simple, intuitive dashboard.


## Problem

Students often struggle to manage large disbursements, leading to overspending and financial stress.

## Features

- 🔐 **User Authentication** - Secure signup and login with JWT tokens
- 💰 **HELB Amount Input** - Enter your semester loan amount
- 📊 **Smart Budget Allocation** - Automatic 50/30/20 style budgeting:
  - Rent: 30%
  - Food: 25%
  - Tuition & Academic: 25%
  - Personal: 10%mmit 
  - Savings: 10%
- 📈 **Dashboard** - View your budget breakdown and transaction history
- 🗄️ **Persistent Storage** - All data stored securely in MariaDB
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 👤 **Profile Management** - User profile with logout functionality


## Solution / MVP

* Register/Login
* Enter lump-sum funds
* Automatic budget allocation (Rent, Food, Tuition, Personal, Savings)
* Dashboard showing remaining balance and category progress
* Log expenses quickly
* Visual progress bars to track spending


## Tech Stack

* **Frontend:** React + Vite + JSX
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
cd web-react
npm install
npm run dev

```

### Frontend
- React 18
- React Router DOM v6
- CSS3 (Custom styling)
- Vite (Build tool)

### Backend
- Node.js
- Express.js
- MariaDB (MySQL compatible)
- JWT for authentication
- bcrypt for password hashing

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MariaDB** (v10.5 or higher) - [Download](https://mariadb.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for cloning)


## Future Enhancements

* Real investment / MMF integration
* Notifications for budget thresholds
* Dark mode
* Backend authentication
* Exportable reports

