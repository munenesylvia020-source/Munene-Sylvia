import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finance } from '../services/api';
import BottomNav from '../components/BottomNav';
import '../styles/dailyLimit.css';

export default function DailyLimitSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Daily limit state
  const [dailyLimit, setDailyLimit] = useState({
    daily_amount: 0,
    phone_number: '',
    disbursement_time: '06:00',
    is_active: false,
    remaining_today: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    daily_amount: '',
    phone_number: '',
    disbursement_time: '06:00',
    is_active: true,
  });

  const [history, setHistory] = useState([]);
  const [todayRemaining, setTodayRemaining] = useState(0);

  // Load daily limit on mount
  useEffect(() => {
    loadDailyLimit();
  }, []);

  const loadDailyLimit = async () => {
    try {
      setLoading(true);
      const response = await finance.getDailyLimit();
      
      // Handle array response (from list endpoint)
      const limit = Array.isArray(response) ? response[0] : response;
      
      if (limit) {
        setDailyLimit(limit);
        setFormData({
          daily_amount: limit.daily_amount || '',
          phone_number: limit.phone_number || '',
          disbursement_time: limit.disbursement_time || '06:00',
          is_active: limit.is_active !== false,
        });
      }

      // Load today's remaining
      const remainingResp = await finance.getTodayRemaining();
      setTodayRemaining(remainingResp.remaining || 0);

      // Load disbursement history
      const historyResp = await finance.getDisbursementHistory();
      setHistory(Array.isArray(historyResp) ? historyResp : []);

      setLoading(false);
    } catch (err) {
      console.error('Error loading daily limit:', err);
      setError(err.message || 'Failed to load daily limit settings');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!formData.daily_amount || formData.daily_amount <= 0) {
        setError('Daily amount must be greater than 0');
        return;
      }

      if (!formData.phone_number || formData.phone_number.trim() === '') {
        setError('Phone number is required');
        return;
      }

      if (formData.daily_amount > 50000) {
        setError('Daily amount cannot exceed KES 50,000');
        return;
      }

      // Submit form
      await finance.setDailyLimit({
        daily_amount: parseFloat(formData.daily_amount),
        phone_number: formData.phone_number.trim(),
        disbursement_time: formData.disbursement_time,
        is_active: formData.is_active,
      });

      setSuccess('Daily limit updated successfully!');
      
      // Reload data
      setTimeout(() => {
        loadDailyLimit();
      }, 1000);

    } catch (err) {
      console.error('Error updating daily limit:', err);
      setError(err.message || 'Failed to update daily limit');
    }
  };

  if (loading) {
    return (
      <div className="daily-limit-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="daily-limit-container">
      <div className="daily-limit-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Daily Spending Limit</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Today's Remaining Display */}
      <div className="remaining-card">
        <div className="remaining-label">Remaining Today</div>
        <div className="remaining-amount">KES {todayRemaining.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        {dailyLimit.daily_amount && (
          <div className="remaining-meta">
            Daily Limit: KES {dailyLimit.daily_amount.toLocaleString('en-KE')}
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="daily-limit-form">
        <h2>Configure Daily Limit</h2>

        <div className="form-group">
          <label htmlFor="daily_amount">Daily Amount (KES)</label>
          <input
            type="number"
            id="daily_amount"
            name="daily_amount"
            value={formData.daily_amount}
            onChange={handleInputChange}
            placeholder="2000"
            min="10"
            max="50000"
            step="100"
            required
          />
          <small>Amount between KES 10 - 50,000</small>
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">Phone Number</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            placeholder="254712345678"
            pattern="^254[0-9]{9}$"
            required
          />
          <small>Format: 254XXXXXXXXX (M-Pesa will be sent to this number)</small>
        </div>

        <div className="form-group">
          <label htmlFor="disbursement_time">Daily Disbursement Time</label>
          <input
            type="time"
            id="disbursement_time"
            name="disbursement_time"
            value={formData.disbursement_time}
            onChange={handleInputChange}
            required
          />
          <small>Time (East African Time) when M-Pesa will be sent daily</small>
        </div>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
          />
          <label htmlFor="is_active">Enable automatic daily disbursement</label>
        </div>

        <button type="submit" className="submit-btn">
          Save Daily Limit Settings
        </button>
      </form>

      {/* Disbursement History */}
      {history.length > 0 && (
        <div className="history-section">
          <h2>Recent Disbursements</h2>
          <div className="history-list">
            {history.slice(0, 10).map((disbursement) => (
              <div key={disbursement.id} className="history-item">
                <div className="history-date">
                  {new Date(disbursement.disbursement_date).toLocaleDateString('en-KE')}
                </div>
                <div className="history-amount">
                  KES {disbursement.amount.toLocaleString('en-KE')}
                </div>
                <div className={`history-status status-${disbursement.status.toLowerCase()}`}>
                  {disbursement.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && dailyLimit.daily_amount && (
        <div className="no-history">
          <p>No disbursements yet. Daily M-Pesa sends will appear here.</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
