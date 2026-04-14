import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { budgetAllocation } from '../constants/budgetAllocation';
import { ShieldCheck, CalendarClock, TrendingUp, History, Smartphone } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { helb, finance, auth } from '../services/api';
import '../styles/HelbAmount.css';

const HelbAmount = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [helbData, setHelbData] = useState(null);
  const [hasHelb, setHasHelb] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHelbInfo() {
      try {
        setLoading(true);
        // We simulate a fallback if the API hasn't been populated with user data yet
        const account = await helb.getAccount().catch(e => null);
        const projectionList = await helb.getProjections().catch(e => []);

        const profileInfo = await auth.getProfile().catch(e => null);
        if (profileInfo && profileInfo.phone_number) {
          setPhoneNumber(profileInfo.phone_number);
        }

        if (account && account.total_approved > 0) {
          setHasHelb(true);
          const projectionData = projectionList[0] || { next_expected_date: "Unknown", next_expected_amount: "0", confidence_level: "N/A" };
          setHelbData({
            total_approved: account.total_approved,
            total_disbursed: account.total_disbursed,
            remaining_balance: account.remaining_balance,
            projection: projectionData
          });
          
          if (projectionData && projectionData.next_expected_amount && parseInt(projectionData.next_expected_amount) > 0) {
             setAmount(parseInt(projectionData.next_expected_amount).toString());
          }
        } else {
          // No active data
          setHasHelb(false);
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

  const validateAmount = () => {
    if (!amount) {
      setError('Please enter an amount');
      return false;
    }
    if (parseInt(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    return true;
  };

  const handleManualTrack = async () => {
    if (!validateAmount()) return;
    try {
      const amt = parseInt(amount);
      await helb.trackAmount(amt);
      navigate('/budget-confirm', { state: { totalAmount: amt } });
    } catch (err) {
      setError('Failed to track disbursement with backend.');
    }
  };

  const handleMpesaImport = async () => {
    if (!validateAmount()) return;
    if (!phoneNumber) {
      setError('Please provide your M-Pesa phone number for the Vault deposit.');
      return;
    }
    
    const phoneRegex = /^(2547|2541)\d{8}$|^0(7|1)\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid M-Pesa format (e.g. 2547... or 07...)');
      return;
    }
    
    try {
      const amt = parseInt(amount);
      await helb.trackAmount(amt);
      
      // Trigger M-Pesa STK Push
      await finance.initiateDeposit(phoneNumber, amt, 'HELB_TOPUP', false);

      navigate('/budget-confirm', { state: { totalAmount: amt, isMpesaImport: true } });
    } catch (err) {
      setError(err.message || 'Failed to initiate M-Pesa deposit.');
    }
  };

  return (
    <div className="helb-dashboard-page">
      <header className="helb-header">
        <h1>HELB Tracker</h1>
        <p className="subtitle">Monitor your loan and upcoming disbursements</p>
      </header>

      {loading ? (
        <div className="helb-loading"><div className="spinner"></div></div>
      ) : (
        <div className="helb-content">
          {hasHelb && helbData && (
            <>
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
              
              <button 
                className="secondary-btn" 
                onClick={() => navigate('/helb-history')}
                style={{ width: '100%', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <History size={18} />
                View Full History
              </button>
            </>
          )}

          <div className="manual-entry-section card-glass">
            <h3>{hasHelb ? "Record Received Funds" : "Link Your HELB Loan"}</h3>
            <p className="hint">
              {hasHelb ? "Did you receive your disbursement? Enter it below to allocate it to your budget." : "Enter your expected or fully approved HELB allocation to instantly activate your 50/30/20 budget framework."}
            </p>
            
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
            
            <div className="amount-input-wrapper" style={{ marginTop: '12px', position: 'relative' }}>
              <Smartphone size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                className="amount-input"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                placeholder="M-Pesa Phone (e.g. 2547...)"
                style={{ paddingLeft: '44px' }}
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

            <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '16px', flexDirection: 'column' }}>
              <button 
                className={`primary-btn process-btn ${!amount || !phoneNumber ? 'disabled' : ''}`}
                onClick={handleMpesaImport}
                disabled={!amount || !phoneNumber}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Import via M-Pesa (Vault Mode) <Smartphone size={18} />
              </button>
              <button 
                className={`secondary-btn ${!amount ? 'disabled' : ''}`}
                onClick={handleManualTrack}
                disabled={!amount}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
              >
                Track Manually <TrendingUp size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default HelbAmount;