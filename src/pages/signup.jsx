
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/signup.css';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);

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
        
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            const { confirmPassword, ...signupData } = formData;

            const response = await fetch('http://localhost:3002/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                
                // Store user data and token immediately
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    console.log('✅ User data stored, redirecting to HELB amount');
                }
                
                // Show success message
                alert('Account created successfully! Redirecting to set up your budget...');
                
                // Redirect to HELB amount page
                setTimeout(() => {
                    navigate('/helb-amount');
                }, 1000);
            } else {
                setApiError(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setApiError('Cannot connect to server. Please make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h1 className="signup-title">Create Account</h1>
                <p className="signup-subtitle">Start managing your HELB wisely</p>

                {success && (
                    <div style={{ 
                        backgroundColor: '#d4edda', 
                        color: '#155724', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        textAlign: 'center',
                        border: '1px solid #c3e6cb'
                    }}>
                        ✅ Account created successfully! Redirecting to set up your budget...
                    </div>
                )}

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
                        <label htmlFor="fullName" className="form-label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                            disabled={loading || success}
                        />
                        {errors.fullName && (
                            <p className="error-message">{errors.fullName}</p>
                        )}
                    </div>

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
                            disabled={loading || success}
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
                            placeholder="Create a password"
                            className={`form-input ${errors.password ? 'input-error' : ''}`}
                            disabled={loading || success}
                        />
                        {errors.password && (
                            <p className="error-message">{errors.password}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                            disabled={loading || success}
                        />
                        {errors.confirmPassword && (
                            <p className="error-message">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="signup-button"
                        disabled={loading || success}
                    >
                        {loading ? 'Creating Account...' : 
                         success ? 'Account Created!' : 'Create Account'}
                    </button>
                </form>

                <p className="login-link">
                    Already have an account?{' '}
                    <Link to="/login" className="login-link-text">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;