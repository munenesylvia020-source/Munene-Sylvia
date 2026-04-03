import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAllocation } from '../constants/budgetAllocation';
import { ShieldCheck, CalendarClock, TrendingUp } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { helb } from '../services/api';
import '../styles/HelbAmount.css';

const HelbAmount = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [helbData, setHelbData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHelbInfo() {
      try {
        setLoading(true);
        // We simulate a fallback if the API hasn't been populated with user data yet
        const account = await helb.getAccount().catch(e => null);
        const projectionList = await helb.getProjections().catch(e => []);

        if (account && projectionList) {
          setHelbData({
            total_approved: account.total_approved,
            total_disbursed: account.total_disbursed,
            remaining_balance: account.remaining_balance,
            projection: projectionList[0] || { next_expected_date: "Unknown", next_expected_amount: "0", confidence_level: "N/A" }
          });
        } else {
          // Fallback UI data
          setHelbData({
            total_approved: "160000.00",
            total_disbursed: "80000.00",
            remaining_balance: "80000.00",
            projection: {
              next_expected_date: "2024-09-15",
              next_expected_amount: "40000.00",
              confidence_level: "HIGH"
            }
          });
        }
      } catch (err) {
        console.error("HELB Tracker error: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadHelbInfo();
  }, []);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleContinue = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }
    if (parseInt(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    // Actually track the amount with backend
    try {
      await helb.trackAmount(parseInt(amount));
      navigate('/budget-confirm', { state: { totalAmount: parseInt(amount) } });
    } catch (err) {
      setError('Failed to track disbursement with backend.');
    }
  };

  return (
    <div className="helb-dashboard-page">
      <header className="helb-header">
        <h1>HELB Tracker</h1>
        <p className="subtitle">Monitor your loan and upcoming disbursements</p>
      </header>

      {loading || !helbData ? (
        <div className="helb-loading"><div className="spinner"></div></div>
      ) : (
        <div className="helb-content">
          <div className="helb-status-card card-glass">
            <div className="status-header">
              <ShieldCheck className="text-success" size={24} />
              <span>Loan Active</span>
            </div>
            <div className="progress-container">
              <div className="progress-labels">
                <span>Disbursed</span>
                <span>{Math.round((parseInt(helbData.total_disbursed) / parseInt(helbData.total_approved)) * 100)}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(parseInt(helbData.total_disbursed) / parseInt(helbData.total_approved)) * 100}%` }}
                ></div>
              </div>
              <div className="progress-details">
                <small>KES {parseInt(helbData.total_disbursed).toLocaleString()}</small>
                <small>of KES {parseInt(helbData.total_approved).toLocaleString()}</small>
              </div>
            </div>
          </div>

          <div className="projection-card card-glass">
            <div className="proj-icon">
              <CalendarClock size={28} color="var(--color-accent)" />
            </div>
            <div className="proj-info">
              <h4>Next Disbursement</h4>
              <h2>KES {parseInt(helbData.projection.next_expected_amount).toLocaleString()}</h2>
              <p>Expected around {new Date(helbData.projection.next_expected_date).toLocaleDateString()}</p>
            </div>
            <div className={`confidence-badge ${helbData.projection.confidence_level.toLowerCase()}`}>
              {helbData.projection.confidence_level} Confidence
            </div>
          </div>

          <div className="manual-entry-section card-glass">
            <h3>Record Received Funds</h3>
            <p className="hint">Did you receive your disbursement? Enter it below to allocate it to your budget.</p>
            
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

            {amount && (
              <div className="split-preview">
                <h4>Preview Allocation</h4>
                <div className="split-pills">
                  {budgetAllocation.map((item, idx) => (
                    <div className="split-pill" key={idx} style={{ borderLeftColor: item.color }}>
                      <span className="pill-name">{item.name}</span>
                      <span className="pill-val">KES {Math.floor((parseInt(amount) * item.percentage) / 100).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              className={`primary-btn process-btn ${!amount ? 'disabled' : ''}`}
              onClick={handleContinue}
              disabled={!amount}
            >
              Process Funds <TrendingUp size={18} />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default HelbAmount;