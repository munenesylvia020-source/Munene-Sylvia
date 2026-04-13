import React, { useState } from 'react';
import { ArrowDownToLine, Phone, X, AlertCircle, CheckCircle } from 'lucide-react';
import { finance } from '../services/api';
import '../styles/deposit.css';

const DepositModal = ({ isOpen, onClose, onSuccess, studentInfo }) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(studentInfo?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const isMock = localStorage.getItem('isMockMode') === 'true';
      const data = await finance.initiateDeposit(phoneNumber, parseFloat(amount), 'Deposit', isMock);
      
      setSuccess('Deposit initiated! Check your phone for the M-Pesa prompt.');
      
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
          <ArrowDownToLine color="var(--color-success)" /> Send Money
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '24px' }}>Top up your wallet via M-Pesa STK Push.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Amount (KES)</label>
            <div className="input-group">
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginLeft: '8px' }}>KES</span>
              <input type="number" className="settings-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" required disabled={loading} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>M-Pesa Number</label>
            <div className="input-group">
              <Phone size={18} color="var(--color-text-muted)" className="input-icon" />
              <input type="text" className="settings-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="2547XXXXXXXX" required disabled={loading} />
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><AlertCircle size={14}/> {error}</div>}
          {success && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', display: 'flex', gap: '4px' }}><CheckCircle size={14}/> {success}</div>}

          <button type="submit" className="primary-btn" disabled={loading || !amount || !phoneNumber} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Processing...' : 'Deposit Funds'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
