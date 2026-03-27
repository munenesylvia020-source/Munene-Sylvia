// // src/App.jsx
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import Homepage from './pages/Homepage';
// import Login from './pages/login';
// import Signup from './pages/signup';
// import HelbAmount from './pages/HelbAmount';
// import BudgetConfirm from './pages/BudgetConfirm';
// import Dashboard from './pages/Dashboard';

// function App() {
//     return (
//         <BrowserRouter>
//             <Routes>
//                 <Route path="/" element={<Homepage />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/signup" element={<Signup />} />
//                 <Route path="/helb-amount" element={<HelbAmount />} />
//                 <Route path="/budget-confirm" element={<BudgetConfirm />} />
//                 <Route path="/dashboard" element={<Dashboard />} />
//             </Routes>
//         </BrowserRouter>
//     );
// }

// export default App;

// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/login';
import Signup from './pages/signup';
import HelbAmount from './pages/HelbAmount';
import BudgetConfirm from './pages/BudgetConfirm';
import Dashboard from './pages/Dashboard';

// Protected Route component to check authentication
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

// Route that redirects to appropriate page if already logged in
const AuthRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const budget = localStorage.getItem('budget');
    
    if (token && user) {
        // If logged in and has budget, go to dashboard
        if (budget) {
            return <Navigate to="/dashboard" replace />;
        }
        // If logged in but no budget, go to HELB amount
        return <Navigate to="/helb-amount" replace />;
    }
    
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Homepage />} />
                
                {/* Auth routes - redirect if already logged in */}
                <Route path="/login" element={
                    <AuthRoute>
                        <Login />
                    </AuthRoute>
                } />
                <Route path="/signup" element={
                    <AuthRoute>
                        <Signup />
                    </AuthRoute>
                } />
                
                {/* Protected routes - require authentication */}
                <Route path="/helb-amount" element={
                    <ProtectedRoute>
                        <HelbAmount />
                    </ProtectedRoute>
                } />
                <Route path="/budget-confirm" element={
                    <ProtectedRoute>
                        <BudgetConfirm />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;