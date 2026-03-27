import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [budgetCategories, setBudgetCategories] = useState([]);
    const [transactions, setTransactions] = useState([
        { id: 1, date: '2026-03-15', description: 'Rent Payment', amount: -6600, category: 'Rent', status: 'completed' },
        { id: 2, date: '2026-03-14', description: 'Food Expenses', amount: -2500, category: 'Food', status: 'completed' },
        { id: 3, date: '2026-03-13', description: 'HELB Disbursement', amount: 22000, category: 'Income', status: 'completed' }
    ]);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        
        setUser(JSON.parse(userData));
        
        // Load budget from localStorage
        const savedBudget = localStorage.getItem('budget');
        console.log('Loading budget from localStorage:', savedBudget);
        
        if (savedBudget) {
            try {
                const budget = JSON.parse(savedBudget);
                console.log('Parsed budget:', budget);
                setBalance(budget.totalAmount);
                setBudgetCategories(budget.categories || []);
                
                // Update transaction with actual HELB amount
                setTransactions(prev => {
                    const updated = [...prev];
                    // Find and update the HELB transaction
                    const helbIndex = updated.findIndex(t => t.category === 'Income');
                    if (helbIndex !== -1) {
                        updated[helbIndex] = {
                            ...updated[helbIndex],
                            amount: budget.totalAmount,
                            description: `HELB Disbursement - KES ${budget.totalAmount.toLocaleString()}`
                        };
                    }
                    return updated;
                });
            } catch (error) {
                console.error('Error parsing budget:', error);
            }
        } else {
            console.log('No budget found in localStorage');
            // Redirect to HELB amount if no budget
            navigate('/helb-amount');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('budget');
        navigate('/');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusClass = (status) => {
        return status === 'completed' ? 'status-completed' : 'status-pending';
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>HELB Manager</h2>
                </div>
                
                <div className="profile-container">
                    <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                        <div className="profile-info">
                            <span className="profile-name">{user.fullName || user.full_name}</span>
                            <div className="profile-avatar">
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </div>
                    
                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="dropdown-user-info">
                                    <div className="dropdown-name">{user.fullName || user.full_name}</div>
                                    <div className="dropdown-email">{user.email}</div>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                <span className="dropdown-icon">🚪</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-section">
                    <h1>Welcome back, {user.fullName || user.full_name}!</h1>
                    <p>Here's your financial overview</p>
                </div>

                <div className="balance-card">
                    <div className="balance-header">
                        <span className="balance-label">Current Balance</span>
                        <span className="balance-icon">💰</span>
                    </div>
                    <div className="balance-amount">{formatCurrency(balance)}</div>
                    <div className="balance-footer">
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="budget-overview">
                    <h2>Budget Allocation</h2>
                    <div className="budget-cards">
                        {budgetCategories.length > 0 ? (
                            budgetCategories.map((category, index) => (
                                <div key={index} className="budget-item">
                                    <span className="budget-category">{category.name}</span>
                                    <span className="budget-percentage">{category.percentage}%</span>
                                    <span className="budget-amount">{formatCurrency(category.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="budget-item">
                                <span className="budget-category">No budget data available</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="transactions-section">
                    <div className="transactions-header">
                        <h2>Transaction History</h2>
                        <button className="view-all-btn">View All</button>
                    </div>
                    
                    <div className="transactions-list">
                        {transactions.map(transaction => (
                            <div key={transaction.id} className="transaction-item">
                                <div className="transaction-icon">
                                    {transaction.amount > 0 ? '💰' : '💳'}
                                </div>
                                <div className="transaction-details">
                                    <div className="transaction-main">
                                        <span className="transaction-description">
                                            {transaction.description}
                                        </span>
                                        <span className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                    <div className="transaction-meta">
                                        <span className="transaction-date">{formatDate(transaction.date)}</span>
                                        <span className="transaction-category">{transaction.category}</span>
                                        <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;