import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/budgetConfirm.css';

const BudgetConfirm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Get amount from navigation state
    const totalAmount = location.state?.totalAmount || 22000;

    console.log('BudgetConfirm - Received amount:', totalAmount);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            navigate('/login');
        }
        
        // Check if user already has budget
        const existingBudget = localStorage.getItem('budget');
        if (existingBudget) {
            console.log('User already has budget, redirecting to dashboard');
            navigate('/dashboard');
        }
    }, [navigate]);

    const budgetData = {
        totalAmount: totalAmount,
        categories: [
            { name: 'Rent', amount: Math.floor(totalAmount * 0.3), percentage: 30, color: '#4299e1' },
            { name: 'Food', amount: Math.floor(totalAmount * 0.25), percentage: 25, color: '#48bb78' },
            { name: 'Tuition & Academic', amount: Math.floor(totalAmount * 0.25), percentage: 25, color: '#ed8936' },
            { name: 'Personal', amount: Math.floor(totalAmount * 0.1), percentage: 10, color: '#9f7aea' },
            { name: 'Savings', amount: Math.floor(totalAmount * 0.1), percentage: 10, color: '#fc8181' }
        ]
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        console.log('💰 Confirming budget for amount:', totalAmount);
        
        try {
            // Save budget data to localStorage
            const budgetToSave = {
                totalAmount: totalAmount,
                categories: budgetData.categories,
                confirmedAt: new Date().toISOString(),
                monthlyAllocation: budgetData.categories
            };
            
            localStorage.setItem('budget', JSON.stringify(budgetToSave));
            console.log('✅ Budget saved to localStorage:', budgetToSave);
            
            // Verify it was saved
            const savedBudget = localStorage.getItem('budget');
            const parsedBudget = JSON.parse(savedBudget);
            console.log('✅ Verified saved budget amount:', parsedBudget.totalAmount);
            
            // Show success message
            alert(`Budget of KES ${totalAmount.toLocaleString()} confirmed successfully! Redirecting to your dashboard `);
            
            // Navigate to dashboard
            navigate('/dashboard');
            
        } catch (error) {
            console.error('❌ Error saving budget:', error);
            setError('Error saving budget. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = () => {
        navigate('/helb-amount');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="budget-container">
            <div className="budget-card-wrapper">
                <div className="budget-card">
                    <h1 className="budget-title">Common Loan Budget</h1>
                    <p className="budget-subtitle">Here's how your money will be allocated</p>

                    {error && (
                        <div style={{ 
                            backgroundColor: '#f8d7da', 
                            color: '#721c24', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="total-amount-section">
                        <span className="total-label">Total Amount</span>
                        <span className="total-value">
                            {formatCurrency(budgetData.totalAmount)}
                        </span>
                    </div>

                    <div className="categories-section">
                        {budgetData.categories.map((category, index) => (
                            <div key={index} className="category-item">
                                <div className="category-info">
                                    <div className="category-name-wrapper">
                                        <span className="category-dot" style={{ backgroundColor: category.color }}></span>
                                        <span className="category-name">{category.name}</span>
                                    </div>
                                    <span className="category-amount">{formatCurrency(category.amount)}</span>
                                </div>
                                <div className="percentage-container">
                                    <div className="percentage-bar">
                                        <div className="percentage-fill" style={{ width: `${category.percentage}%`, backgroundColor: category.color }}></div>
                                    </div>
                                    <span className="percentage-value">{category.percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="action-buttons">
                        <button onClick={handleAdjust} className="adjust-button" disabled={loading}>
                            Adjust Budget
                        </button>
                        <button onClick={handleConfirm} className="confirm-button" disabled={loading}>
                            {loading ? 'Confirming...' : 'Confirm Budget'}
                        </button>
                    </div>

                    <p className="summary-note">
                        Your budget has been created based on standard HELB recommendations
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BudgetConfirm;