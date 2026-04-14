import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import appLogo from '../assets/Penny Professor logo 1.png';


function Allocation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Cloud sync was handled in BudgetConfirm.jsx
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
