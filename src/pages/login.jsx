import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';  
import appLogo from '../assets/Penny Professor logo 1.png';

const Login = () => {
  const navigate = useNavigate();  
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };


const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = validateForm();
  if (Object.keys(newErrors).length === 0) {
    console.log('Login submitted:', formData)
    navigate('/helb-amount');
  } else {
    setErrors(newErrors);
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={appLogo} alt="Penny Professor logo" className="login-logo" />
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Login to manage your budget</p>

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
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>

          <button type="submit" className="login-button">
            Log In
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