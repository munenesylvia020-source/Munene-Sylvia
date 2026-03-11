import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/budgetConfirm.css';

const BudgetConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get amount from navigation state or use default
  const totalAmount = location.state?.totalAmount || 22000;

  const budgetData = {
    totalAmount: totalAmount,
    categories: [
      { name: 'Rent', amount: Math.floor(totalAmount * 0.3), percentage: 30, color: '#4299e1' },
      { name: 'Food', amount: Math.floor(totalAmount * 0.25), percentage: 25, color: '#48bb78' },
      { name: 'Tuition & Academic', amount: Math.floor(totalAmount * 0.25), percentage: 25, color: '#ed8936' },
      { name: 'Personal', amount: Math.floor(totalAmount * 0.15), percentage: 15, color: '#9f7aea' },
      { name: 'Savings', amount: Math.floor(totalAmount * 0.05), percentage: 5, color: '#fc8181' }
    ]
  };
  const handleConfirm = () => {
    console.log('Budget confirmed');
    alert('Budget confirmed! (demo)');
  };

  const handleAdjust = () => {
    navigate(-1);
  };

  return (
    <div className="budget-container">
      <div className="budget-card-wrapper">
        <div className="budget-card">
          <h1 className="budget-title">Common Loan Budget</h1>
          <p className="budget-subtitle">Here's how your money will be allocated</p>

          {/* Total Amount */}
          <div className="total-amount-section">
            <span className="total-label">Total Amount</span>
            <span className="total-value">KES {budgetData.totalAmount.toLocaleString()}</span>
          </div>

          {/* Budget Categories */}
          <div className="categories-section">
            {budgetData.categories.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <div className="category-name-wrapper">
                    <span 
                      className="category-dot" 
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <span className="category-name">{category.name}</span>
                  </div>
                  <span className="category-amount">KES {category.amount.toLocaleString()}</span>
                </div>
                
                {/* Percentage Bar */}
                <div className="percentage-container">
                  <div className="percentage-bar">
                    <div 
                      className="percentage-fill"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color 
                      }}
                    ></div>
                  </div>
                  <span className="percentage-value">{category.percentage}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={handleAdjust} className="adjust-button">
              Adjust Budget
            </button>
            <button onClick={handleConfirm} className="confirm-button">
              Confirm Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetConfirm;