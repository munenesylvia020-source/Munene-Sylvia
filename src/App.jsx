// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import HelbAmount from './pages/HelbAmount'; 
import BudgetConfirm from './pages/BudgetConfirm';
import BudgetAdjust from './pages/BudgetAdjust';
import Allocation from './pages/allocation';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Activity from './pages/Activity';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/helb-amount" element={<HelbAmount />} />
        <Route path="/budget-confirm" element={<BudgetConfirm />} />
         <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/budget-adjust" element={<BudgetAdjust />} />
        <Route path="/allocation" element={<Allocation />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;