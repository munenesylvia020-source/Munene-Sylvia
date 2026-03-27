// src/pages/BudgetConfirm.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { budgetAllocation } from '../constants/budgetAllocation';
import appLogo from '../assets/Penny Professor logo 1.png';
import { saveBudget } from '../utils/budgetStore';

const BudgetConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const totalAmount = Number(location.state?.totalAmount) > 0
    ? Number(location.state.totalAmount)
    : 22000;

  const hasAdjustedCategories = Array.isArray(location.state?.categories)
    && location.state.categories.length > 0;

  const categories = hasAdjustedCategories
    ? location.state.categories.map((category) => ({
      ...category,
      amount: Math.max(0, Math.round(Number(category.amount) || 0)),
      percentage: Number(category.percentage) || 0
    }))
    : budgetAllocation.map((category, index) => {
      if (index === budgetAllocation.length - 1) {
        const allocatedBeforeLast = budgetAllocation
          .slice(0, -1)
          .reduce((sum, item) => sum + Math.floor((totalAmount * item.percentage) / 100), 0);
        return {
          ...category,
          amount: totalAmount - allocatedBeforeLast
        };
      }

      return {
        ...category,
        amount: Math.floor((totalAmount * category.percentage) / 100)
      };
    });

  const handleConfirm = () => {
    saveBudget({ totalAmount, categories });
    navigate('/allocation', { state: { totalAmount, categories } });
  };

  const handleAdjust = () => {
    navigate('/budget-adjust', { state: { totalAmount, categories } });
  };

  return (
    <div className="budget-container">
      <div className="budget-card-wrapper">
        <div className="budget-card">
          <img src={appLogo} alt="Penny Professor logo" className="budget-logo" />
          <h1 className="budget-title">Common Loan Budget</h1>
          <p className="budget-subtitle">Here's how your money will be allocated</p>

          {/* Total Amount */}
          <div className="total-amount-section">
            <span className="total-label">Total Amount</span>
            <span className="total-value">KES {totalAmount.toLocaleString()}</span>
          </div>

          {/* Budget Categories */}
          <div className="categories-section">
            {categories.map((category, index) => (
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