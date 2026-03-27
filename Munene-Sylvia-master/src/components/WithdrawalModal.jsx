import React, { useState } from 'react';
import '../styles/withdrawal.css';

const WithdrawalModal = ({ isOpen, onClose, onSuccess, walletBalance, studentInfo }) => {
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
      // Validate balance
      const amountNum = parseFloat(amount);
      if (amountNum > walletBalance) {
        setError(`Insufficient balance. Available: KES ${walletBalance}`);
        setLoading(false);
        return;
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/v1/finance/b2c/initiate/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount: amountNum,
          purpose: purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to initiate withdrawal');
        setLoading(false);
        return;
      }

      setSuccess('Withdrawal initiated! The funds will be sent to your M-Pesa account.');
      setAmount('');
      setPhoneNumber('');
      
      // Call parent callback
      if (onSuccess) {
        onSuccess(data);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Withdraw to M-Pesa</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="withdrawal-form">
          <div className="balance-info">
            <p>Available Balance: <strong>KES {walletBalance?.toFixed(2)}</strong></p>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Withdrawal Amount (KES)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max={Math.min(walletBalance, 500000)}
              step="100"
              required
              disabled={loading}
            />
            <small>Available: KES {walletBalance?.toFixed(2)}</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Recipient Phone Number</label>
            <input
              type="text"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254712345678"
              required
              disabled={loading}
            />
            <small>Format: 254XXXXXXXXX (Kenyan number)</small>
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <select
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={loading}
            >
              <option value="BusinessPayment">Business Payment</option>
              <option value="SalaryPayment">Salary Payment</option>
              <option value="PromotionalPayment">Promotional Payment</option>
            </select>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !amount || !phoneNumber || parseFloat(amount) > walletBalance}
          >
            {loading ? 'Processing...' : 'Withdraw via M-Pesa'}
          </button>

          <p className="info-text">
            The funds will be transferred to the recipient's M-Pesa account within 1-3 minutes.
          </p>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;
