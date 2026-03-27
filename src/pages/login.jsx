import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/login.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const budget = localStorage.getItem('budget');
        
        console.log('Login page - checking existing session:', { 
            hasToken: !!token, 
            hasUser: !!user, 
            hasBudget: !!budget 
        });
        
        if (token && user && budget) {
            // User has budget, go directly to dashboard
            console.log('User has budget, redirecting to dashboard');
            navigate('/dashboard');
        } else if (token && user && !budget) {
            // User logged in but no budget yet
            console.log('User has no budget, redirecting to HELB amount');
            navigate('/helb-amount');
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (apiError) {
            setApiError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            console.log('Sending login request...');
            
            const response = await fetch('http://localhost:3002/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                // Store user data and token
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    console.log('✅ User data stored in localStorage');
                }
                
                // Check if user has budget
                const hasBudget = localStorage.getItem('budget');
                console.log('Budget check after login:', hasBudget ? 'Has budget' : 'No budget');
                
                // Show success message
                alert('Login successful!');
                
                // Redirect based on budget existence
                if (hasBudget) {
                    console.log('Redirecting to dashboard...');
                    navigate('/dashboard');
                } else {
                    console.log('Redirecting to HELB amount page...');
                    navigate('/helb-amount');
                }
            } else {
                setApiError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setApiError('Cannot connect to server. Please make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">Login to manage your budget</p>

                {apiError && (
                    <div style={{ 
                        backgroundColor: '#f8d7da', 
                        color: '#721c24', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px solid #f5c6cb'
                    }}>
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className={`form-input ${errors.email ? 'input-error' : ''}`}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="error-message">{errors.email}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className={`form-input ${errors.password ? 'input-error' : ''}`}
                            disabled={loading}
                        />
                        {errors.password && (
                            <p className="error-message">{errors.password}</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="signup-link">
                    Don't have an account?{' '}
                    <Link to="/signup" className="signup-link-text">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;