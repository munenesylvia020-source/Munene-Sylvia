import React, { useState } from 'react';
import { ArrowUpFromLine, Phone, X, AlertCircle, CheckCircle, Briefcase } from 'lucide-react';
import { finance } from '../services/api';

const WithdrawalModal = ({ isOpen, onClose, onSuccess, walletBalance }) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purpose, setPurpose] = useState('BusinessPayment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amountNum = parseFloat(amount);
      if (amountNum > walletBalance) {
        setError(`Insufficient funds. You only have KES ${walletBalance?.toLocaleString()}`);
        setLoading(false);
        return;
      }

      const isMock = localStorage.getItem('isMockMode') === 'true';
      const data = await finance.initiateWithdrawal(phoneNumber, amountNum, purpose, isMock);

      setSuccess('Withdrawal initiated! Funds will be disbursed to M-Pesa.');
      if (onSuccess) onSuccess(data);
      setTimeout(() => {
        setAmount('');
        setError('');
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card-glass" onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: '400px', padding: 'var(--spacing-6)', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', color: 'var(--color-text-muted)' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpFromLine color="var(--color-error)" /> Withdraw Funds
          {localStorage.getItem('isMockMode') === 'true' && (
            <span style={{ background: 'var(--color-warning)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>DEV MODE</span>
          )}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>Move funds from your wallet to any M-Pesa number.</p>

        <div style={{ background: 'var(--color-backdrop-overlay)', padding: '12px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Available Balance</span>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>KES {walletBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Withdrawal Amount</label>
            <div className="input-group">
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '8px' }}>KES</span>
              <input type="number" className="settings-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" max={walletBalance || 500000} required disabled={loading} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Destination Phone</label>
            <div className="input-group">
              <Phone size={18} color="var(--color-text-muted)" className="input-icon" />
              <input type="text" className="settings-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="2547XXXXXXXX" required disabled={loading} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Purpose</label>
            <div className="input-group">
              <Briefcase size={18} color="var(--color-text-muted)" className="input-icon" />
              <select className="settings-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={loading} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}>
                <option value="BusinessPayment">Business Payment</option>
                <option value="SalaryPayment">Salary Payment</option>
                <option value="PromotionalPayment">Promotional / Payout</option>
              </select>
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><AlertCircle size={14}/> {error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><CheckCircle size={14}/> {success}</div>}

          <button type="submit" className="primary-btn" disabled={loading || !amount || !phoneNumber || parseFloat(amount) > walletBalance} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Processing...' : 'Complete Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;
