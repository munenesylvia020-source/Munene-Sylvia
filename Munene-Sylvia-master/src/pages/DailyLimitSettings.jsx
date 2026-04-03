import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finance } from '../services/api';
import BottomNav from '../components/BottomNav';
import { ShieldAlert, TrendingUp, Clock, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/settings.css';

export default function DailyLimitSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [dailyLimit, setDailyLimit] = useState({});
  const [formData, setFormData] = useState({
    daily_amount: '',
    phone_number: '',
    disbursement_time: '06:00',
    is_active: true,
  });

  const [history, setHistory] = useState([]);
  const [todayRemaining, setTodayRemaining] = useState(0);

  useEffect(() => { loadDailyLimit(); }, []);

  const loadDailyLimit = async () => {
    try {
      setLoading(true);
      const response = await finance.getDailyLimit();
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
      const remainingResp = await finance.getTodayRemaining();
      setTodayRemaining(remainingResp.remaining || 0);

      const historyResp = await finance.getDisbursementHistory();
      setHistory(Array.isArray(historyResp) ? historyResp : []);
    } catch (err) {
      setError(err.message || 'Failed to load daily limit settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!formData.daily_amount || formData.daily_amount <= 0) return setError('Daily amount must be > 0');
    if (!formData.phone_number) return setError('Phone number is required');
    if (formData.daily_amount > 50000) return setError('Limit cannot exceed KES 50,000');

    try {
      await finance.setDailyLimit({
        daily_amount: parseFloat(formData.daily_amount),
        phone_number: formData.phone_number.trim(),
        disbursement_time: formData.disbursement_time,
        is_active: formData.is_active,
      });
      setSuccess('Daily limit updated successfully!');
      setTimeout(() => loadDailyLimit(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to update daily limit');
    }
  };

  if (loading) return <div className="settings-page"><div className="spinner"></div></div>;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Spending Guard</h1>
        <p className="subtitle">Restrict M-Pesa withdrawals and set daily allowances.</p>
      </header>

      <div className="settings-content">
        <div className="card-glass" style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'var(--color-primary-light)', padding: '10px', borderRadius: '50%', color: 'var(--color-background)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '2px' }}>Today's Allowance</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                {dailyLimit.daily_amount ? `Max KES ${dailyLimit.daily_amount.toLocaleString()}/day` : 'No Limit Set'}
              </p>
            </div>
          </div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '16px' }}>
            KES {todayRemaining.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <h3 className="section-title">Enforce Withdrawal Limit</h3>
        <form onSubmit={handleSubmit} className="settings-section card-glass">
          <p className="hint">Activate daily automatic allowances sent safely to your M-Pesa. Strict withdrawals block transfers exceeding your setup limit.</p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Daily Amount (KES)</label>
            <div className="input-group">
              <TrendingUp size={18} color="var(--color-text-muted)" />
              <input type="number" name="daily_amount" value={formData.daily_amount} onChange={handleInputChange} placeholder="e.g. 500" min="10" max="50000" className="settings-input" required />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Receiving M-Pesa Number</label>
            <div className="input-group">
              <Phone size={18} color="var(--color-text-muted)" />
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="2547XXXXXXXX" pattern="^254[0-9]{9}$" className="settings-input" required />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Daily Send Time</label>
            <div className="input-group">
              <Clock size={18} color="var(--color-text-muted)" />
              <input type="time" name="disbursement_time" value={formData.disbursement_time} onChange={handleInputChange} className="settings-input" required />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }}/>
            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Lock Wallet & Auto-Disburse Daily</label>
          </div>

          {error && <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><AlertCircle size={14}/> {error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><CheckCircle size={14}/> {success}</div>}

          <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '16px' }}>Enforce Limit</button>
        </form>

        <h3 className="section-title">Recent Allowances</h3>
        <div className="card-glass">
            {history.length > 0 ? (
                history.slice(0, 5).map((disb) => (
                    <div key={disb.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
                        <div>
                            <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Automatic Limit Send</p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(disb.disbursement_date).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 600, color: 'var(--color-error)' }}>-KES {disb.amount.toLocaleString()}</p>
                            <p style={{ fontSize: '0.65rem', color: disb.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)' }}>{disb.status}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No daily allowances have triggered yet.</p>
            )}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
