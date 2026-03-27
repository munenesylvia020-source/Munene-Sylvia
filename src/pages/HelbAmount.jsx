// src/pages/HelbAmount.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HelbAmount.css';

const HelbAmount = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const budget = localStorage.getItem('budget');
        
        console.log('HelbAmount - Auth check:', { 
            hasToken: !!token, 
            hasUser: !!user,
            hasBudget: !!budget
        });
        
        if (!token || !user) {
            console.log('No token/user, redirecting to login');
            navigate('/login');
        }
        
        // If user already has budget, redirect to dashboard
        if (budget) {
            console.log('User already has budget, redirecting to dashboard');
            navigate('/dashboard');
        }
    }, [navigate]);

    const budgetAllocation = [
        { category: 'Rent', percentage: 30, color: '#4299e1' },
        { category: 'Food', percentage: 25, color: '#48bb78' },
        { category: 'Tuition & Academic', percentage: 25, color: '#ed8936' },
        { category: 'Personal', percentage: 10, color: '#9f7aea' },
        { category: 'Savings', percentage: 10, color: '#fc8181' }
    ];

    const handleAmountChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            setAmount(value);
            setError('');
        }
    };

    const handleContinue = async (e) => {
        e.preventDefault();
        console.log('Continue button clicked with amount:', amount);
        
        if (!amount) {
            setError('Please enter an amount');
            return;
        }
        
        const numAmount = parseInt(amount);
        if (numAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Navigating to budget confirm with amount:', numAmount);
            navigate('/budget-confirm', { 
                state: { totalAmount: numAmount } 
            });
        } catch (error) {
            console.error('Navigation error:', error);
            setError('Failed to navigate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (value) => {
        if (!value) return '0';
        return parseInt(value).toLocaleString();
    };

    return (
        <div className="helb-container">
            <div className="helb-card-wrapper">
                <div className="helb-card">
                    <h1 className="helb-title">Enter Your HELB Amount</h1>
                    <p className="helb-subtitle">How much did you receive this semester?</p>

                    <form onSubmit={handleContinue} className="amount-section">
                        <label className="amount-label">Total Amount (KES)</label>
                        <div className="amount-input-wrapper">
                            <span className="amount-currency">KES</span>
                            <input
                                type="text"
                                className="amount-input"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                inputMode="numeric"
                                disabled={loading}
                            />
                        </div>
                        {error && <p className="amount-error">{error}</p>}
                        
                        {amount && (
                            <div className="amount-preview">
                                <span className="preview-label">You entered:</span>
                                <span className="preview-value">KES {formatAmount(amount)}</span>
                            </div>
                        )}
                    </form>

                    <div className="split-section">
                        <h2 className="split-title">Your budget will be split into:</h2>
                        
                        <div className="split-categories">
                            {budgetAllocation.map((item, index) => (
                                <div key={index} className="split-item">
                                    <div className="split-info">
                                        <span className="split-category">{item.category}</span>
                                        <span className="split-percentage">{item.percentage}%</span>
                                    </div>
                                    <div className="split-bar-container">
                                        <div 
                                            className="split-bar"
                                            style={{ 
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.color 
                                            }}
                                        ></div>
                                    </div>
                                    {amount && (
                                        <div className="split-amount">
                                            KES {Math.floor((parseInt(amount) * item.percentage) / 100).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        className={`continue-button ${amount && !loading ? 'active' : ''}`}
                        onClick={handleContinue}
                        disabled={!amount || loading}
                    >
                        {loading ? 'Processing...' : 'Continue'}
                    </button>

                    <p className="info-note">
                        This allocation is based on standard HELB recommendations for students
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HelbAmount;