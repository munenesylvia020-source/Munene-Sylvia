// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Activity from './pages/Activity';
import DailyLimitSettings from './pages/DailyLimitSettings';
import HelbAmount from './pages/HelbAmount';
import BudgetConfirm from './pages/BudgetConfirm';
import Allocation from './pages/allocation';
import BudgetAdjust from './pages/BudgetAdjust';
import Logout from './pages/Logout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout" element={<Logout />} />

        <Route
          path="/helb-amount"
          element={
            <ProtectedRoute>
              <HelbAmount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget-confirm"
          element={
            <ProtectedRoute>
              <BudgetConfirm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allocation"
          element={
            <ProtectedRoute>
              <Allocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget-adjust"
          element={
            <ProtectedRoute>
              <BudgetAdjust />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-limit"
          element={
            <ProtectedRoute>
              <DailyLimitSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;