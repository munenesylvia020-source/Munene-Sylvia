import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { budgetAllocation } from '../constants/budgetAllocation';
import appLogo from '../assets/Penny Professor logo 1.png';

const getDefaultCategories = (totalAmount) => {
  return budgetAllocation.map((category, index) => {
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
};

const normalizeCategories = (categories, totalAmount) => {
  return categories.map((category) => ({
    ...category,
    amount: Math.max(0, Math.round(Number(category.amount) || 0)),
    percentage: totalAmount > 0
      ? Number((((Number(category.amount) || 0) / totalAmount) * 100).toFixed(2))
      : 0
  }));
};

const BudgetAdjust = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const totalAmount = Number(location.state?.totalAmount) > 0
    ? Number(location.state.totalAmount)
    : 22000;

  const initialCategories = useMemo(() => {
    const incoming = location.state?.categories;

    if (Array.isArray(incoming) && incoming.length > 0) {
      return incoming.map((item) => ({
        ...item,
        costType: item.costType || 'variable',
        amount: Math.max(0, Math.round(Number(item.amount) || 0)),
        percentage: Number(item.percentage) || 0
      }));
    }

    return getDefaultCategories(totalAmount);
  }, [location.state, totalAmount]);

  const [categories, setCategories] = useState(initialCategories);

  const totals = useMemo(() => {
    const allocated = categories.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const percentageTotal = categories.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);

    return {
      allocated,
      remaining: totalAmount - allocated,
      percentageTotal
    };
  }, [categories, totalAmount]);

  const updateAmount = (index, value) => {
    const parsedAmount = value === '' ? 0 : Math.max(0, Math.round(Number(value) || 0));

    setCategories((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        amount: parsedAmount,
        percentage: totalAmount > 0
          ? Number(((parsedAmount / totalAmount) * 100).toFixed(2))
          : 0
      };
      return next;
    });
  };

  const updatePercentage = (index, value) => {
    const parsedPercentage = value === '' ? 0 : Math.max(0, Number(value) || 0);

    setCategories((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        percentage: parsedPercentage,
        amount: totalAmount > 0
          ? Math.max(0, Math.round((totalAmount * parsedPercentage) / 100))
          : 0
      };
      return next;
    });
  };

  const handleAutoBalance = () => {
    setCategories((prev) => {
      if (prev.length === 0) return prev;

      const allocatedBeforeLast = prev.slice(0, -1).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const balancedLastAmount = Math.max(0, totalAmount - allocatedBeforeLast);

      const next = [...prev];
      const lastIndex = next.length - 1;
      next[lastIndex] = {
        ...next[lastIndex],
        amount: balancedLastAmount,
        percentage: totalAmount > 0 ? Number(((balancedLastAmount / totalAmount) * 100).toFixed(2)) : 0
      };

      return next;
    });
  };

  const handleSaveAndContinue = () => {
    const normalized = normalizeCategories(categories, totalAmount);

    navigate('/budget-confirm', {
      state: {
        totalAmount,
        categories: normalized
      }
    });
  };

  const fixedCategories = categories.filter((item) => item.costType === 'fixed');
  const variableCategories = categories.filter((item) => item.costType !== 'fixed');

  const renderCategoryRow = (category) => {
    const index = categories.findIndex((item) => item.name === category.name);

    return (
      <div className="adjust-row" key={category.name}>
        <div className="adjust-name-wrap">
          <span className="adjust-dot" style={{ backgroundColor: category.color }}></span>
          <span className="adjust-name">{category.name}</span>
        </div>

        <div className="adjust-inputs">
          <label className="adjust-input-label">
            %
            <input
              type="number"
              className="adjust-input"
              min="0"
              step="0.01"
              value={category.percentage}
              onChange={(e) => updatePercentage(index, e.target.value)}
            />
          </label>

          <label className="adjust-input-label">
            KES
            <input
              type="number"
              className="adjust-input"
              min="0"
              step="1"
              value={category.amount}
              onChange={(e) => updateAmount(index, e.target.value)}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="adjust-container">
      <div className="adjust-card-wrapper">
        <div className="adjust-card">
          <img src={appLogo} alt="Penny Professor logo" className="adjust-logo" />
          <h1 className="adjust-title">Adjust Your Budget</h1>
          <p className="adjust-subtitle">Set your own percentages or amounts for fixed and variable costs</p>

          <div className="adjust-total-box">
            <span className="adjust-total-label">Total Loan</span>
            <span className="adjust-total-value">KES {totalAmount.toLocaleString()}</span>
          </div>

          <section className="adjust-section">
            <h2 className="adjust-section-title">Fixed Costs</h2>
            {fixedCategories.map(renderCategoryRow)}
          </section>

          <section className="adjust-section">
            <h2 className="adjust-section-title">Variable Costs</h2>
            {variableCategories.map(renderCategoryRow)}
          </section>

          <div className="adjust-summary">
            <p>Allocated: <strong>KES {totals.allocated.toLocaleString()}</strong></p>
            <p>Remaining: <strong className={totals.remaining === 0 ? 'balanced' : 'unbalanced'}>KES {totals.remaining.toLocaleString()}</strong></p>
            <p>Total %: <strong>{totals.percentageTotal.toFixed(2)}%</strong></p>
          </div>

          <div className="adjust-actions">
            <button type="button" className="adjust-secondary-btn" onClick={() => navigate('/budget-confirm', { state: { totalAmount, categories } })}>
              Back
            </button>
            <button type="button" className="adjust-secondary-btn" onClick={handleAutoBalance}>
              Auto-balance
            </button>
            <button
              type="button"
              className="adjust-primary-btn"
              onClick={handleSaveAndContinue}
              disabled={totals.remaining !== 0}
            >
              Save and Continue
            </button>
          </div>

          <p className="adjust-note">Save is enabled when allocated amount exactly matches your total loan.</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetAdjust;
