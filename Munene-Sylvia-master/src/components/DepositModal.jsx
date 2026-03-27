import React, { useState } from 'react';
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
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/v1/finance/transactions/initiate_deposit/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to initiate deposit');
        setLoading(false);
        return;
      }

      setSuccess('Deposit initiated! You will receive an M-Pesa prompt on your phone.');
      setAmount('');
      
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
      console.error('Deposit error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Money to Wallet</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="form-group">
            <label htmlFor="amount">Amount (KES)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max="500000"
              step="100"
              required
              disabled={loading}
            />
            <small>Min: KES 1 | Max: KES 500,000</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
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

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !amount || !phoneNumber}
          >
            {loading ? 'Processing...' : 'Send Money via M-Pesa'}
          </button>

          <p className="info-text">
            You will receive an M-Pesa prompt on your phone. Complete the payment to deposit funds.
          </p>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
