import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import appLogo from '../assets/Penny Professor logo 1.png';
import { saveBudget } from '../utils/budgetStore';

function Allocation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const totalAmount = Number(location.state?.totalAmount);
    const categories = location.state?.categories;

    if (totalAmount > 0 && Array.isArray(categories) && categories.length > 0) {
      saveBudget({ totalAmount, categories });
    }
  }, [location.state]);

  return (
    <div className="allocation-container">
      <div className="allocation-card">
        <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" />
        <h1 className="allocation-title">Budget Setup Complete</h1>
        <p className="allocation-subtitle">
          Your budget has been saved and your categories are ready to track.
        </p>
        <button
          type="button"
          className="allocation-btn"
          onClick={() => navigate('/dashboard')}
        >
          Proceed to Dashboard
        </button>
        <button
          type="button"
          className="allocation-btn"
          onClick={() => navigate('/helb-amount')}
        >
          Start New Allocation
        </button>
      </div>
    </div>
  );
}

export default Allocation;
