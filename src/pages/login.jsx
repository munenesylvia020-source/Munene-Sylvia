<<<<<<< HEAD
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';  // Add useNavigate
import '../styles/login.css';

const Login = () => {
  const navigate = useNavigate();  // Add this hook
  
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
  // src/pages/Login.jsx (updated handleSubmit)
const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = validateForm();
  if (Object.keys(newErrors).length === 0) {
    console.log('Login submitted:', formData);
    // Navigate to HELB amount page after successful login
    navigate('/helb-amount');
  } else {
    setErrors(newErrors);
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
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
=======
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = (e)=>{
    e.preventDefault();
    console.log("Login",email,password);
  }

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1 className="app-title">Penny Professor</h1>
        <p className="subtitle">Login to manage your budget.</p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="student@email.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>

          <button className="primary-btn">Log In</button>

          <p className="switch-text">
            Don't have an account?
            <Link to="/signup"> Sign Up</Link>
          </p>

        </form>

      </div>

    </div>
  )
}

export default Login;
>>>>>>> d8aa9553451eaa167ee423c2bdcfdf218120443c
