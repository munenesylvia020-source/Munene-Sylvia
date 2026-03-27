// src/pages/DebugStatus.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DebugStatus = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const budget = localStorage.getItem('budget');
        
        let userData = null;
        let budgetData = null;
        
        try {
            userData = JSON.parse(user);
        } catch (e) {}
        
        try {
            budgetData = JSON.parse(budget);
        } catch (e) {}
        
        setStatus({
            hasToken: !!token,
            hasUser: !!user,
            hasBudget: !!budget,
            tokenPreview: token ? token.substring(0, 20) + '...' : null,
            userData,
            budgetData,
            localStorage: {
                token,
                user,
                budget
            }
        });
        setLoading(false);
    };

    const clearAll = () => {
        localStorage.clear();
        checkStatus();
    };

    const setTestBudget = () => {
        const testBudget = {
            totalAmount: 22000,
            categories: [
                { name: 'Rent', amount: 6600, percentage: 30 },
                { name: 'Food', amount: 5500, percentage: 25 },
                { name: 'Tuition', amount: 5500, percentage: 25 },
                { name: 'Personal', amount: 2200, percentage: 10 },
                { name: 'Savings', amount: 2200, percentage: 10 }
            ],
            confirmedAt: new Date().toISOString()
        };
        localStorage.setItem('budget', JSON.stringify(testBudget));
        checkStatus();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Debug Status</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <button onClick={checkStatus} style={{ marginRight: '10px' }}>Refresh</button>
                <button onClick={clearAll} style={{ marginRight: '10px', background: 'red', color: 'white' }}>Clear All</button>
                <button onClick={setTestBudget} style={{ background: 'green', color: 'white' }}>Set Test Budget</button>
                <button onClick={() => navigate('/login')} style={{ marginLeft: '10px' }}>Go to Login</button>
                <button onClick={() => navigate('/helb-amount')} style={{ marginLeft: '10px' }}>Go to HELB Amount</button>
                <button onClick={() => navigate('/budget-confirm')} style={{ marginLeft: '10px' }}>Go to Budget Confirm</button>
                <button onClick={() => navigate('/dashboard')} style={{ marginLeft: '10px' }}>Go to Dashboard</button>
            </div>

            <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '5px' }}>
                <h2>Status:</h2>
                <pre>{JSON.stringify(status, null, 2)}</pre>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Manual Actions:</h3>
                <button onClick={() => {
                    localStorage.removeItem('budget');
                    checkStatus();
                }}>Remove Budget Only</button>
            </div>
        </div>
    );
};

export default DebugStatus;