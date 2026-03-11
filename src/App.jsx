<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import HelbAmount from './pages/HelbAmount';      // New page
import BudgetConfirm from './pages/BudgetConfirm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/helb-amount" element={<HelbAmount />} />
        <Route path="/budget-confirm" element={<BudgetConfirm />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
=======
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";


import "./App.css";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>
    </Router>
  );
}

export default App;
>>>>>>> d8aa9553451eaa167ee423c2bdcfdf218120443c
