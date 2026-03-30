import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAllocation } from '../constants/budgetAllocation';
import appLogo from '../assets/Penny Professor logo 1.png';

const HelbAmount = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleContinue = () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }
    if (parseInt(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    // Navigate to budget confirmation with the amount
    navigate('/budget-confirm', { state: { totalAmount: parseInt(amount) } });
  };

  const formatAmount = (value) => {
    if (!value) return '0';
    return parseInt(value).toLocaleString();
  };

  return (
    <div className="helb-container">
      <div className="helb-card-wrapper">
        <div className="helb-card">
          <img src={appLogo} alt="Penny Professor logo" className="helb-logo" />
          <h1 className="helb-title">Enter Your HELB Amount</h1>
          <p className="helb-subtitle">How much did you receive this semester?</p>

          {/* Amount Input Section */}
          <div className="amount-section">
            <label className="amount-label">Total Amount (KES)</label>
            <div className="amount-input-wrapper">
              <span className="amount-currency">KES</span>
              <input
                type="text"
                className="amount-input"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
            {error && <p className="amount-error">{error}</p>}
            
            {/* Display formatted amount */}
            {amount && (
              <div className="amount-preview">
                <span className="preview-label">You entered:</span>
                <span className="preview-value">KES {formatAmount(amount)}</span>
              </div>
            )}
          </div>

          {/* Budget Split Preview */}
          <div className="split-section">
            <h2 className="split-title">Your budget will be split into:</h2>
            
            <div className="split-categories">
              {budgetAllocation.map((item, index) => (
                <div key={index} className="split-item">
                  <div className="split-info">
                    <span className="split-category">{item.name}</span>
                    <span className="split-percentage">{item.percentage}%</span>
                  </div>
                  <div className="split-bar-container">
                    <div 
                      className="split-bar"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    ></div>
                  </div>
                  {/* Show calculated amount if user entered an amount */}
                  {amount && (
                    <div className="split-amount">
                      KES {Math.floor((parseInt(amount) * item.percentage) / 100).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button 
            className={`continue-button ${amount ? 'active' : ''}`}
            onClick={handleContinue}
            disabled={!amount}
          >
            Continue
          </button>

          {/* Info Note */}
          <p className="info-note">
            This allocation is based on standard HELB recommendations for students
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelbAmount;