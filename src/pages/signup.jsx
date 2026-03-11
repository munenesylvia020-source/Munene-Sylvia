<<<<<<< HEAD
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/signup.css';  // Import CSS from styles folder

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      console.log('Signup submitted:', formData);
      alert('Account created successfully! (demo)');
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Start managing your HELB wisely</p>

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
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
            <p className="password-hint">Must be at least 6 characters</p>
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
            />
            {errors.confirmPassword && (
              <p className="error-message">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="terms-group">
            <input 
              type="checkbox" 
              id="terms" 
              className="terms-checkbox"
              required
            />
            <label htmlFor="terms" className="terms-label">
              I agree to the <a href="/terms" className="terms-link">Terms of Service</a> and <a href="/privacy" className="terms-link">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" className="signup-button">
            Create Account
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
=======
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Signup(){

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = (e)=>{
    e.preventDefault();
    console.log("Signup",name,email,password);
  }

  return(

    <div className="auth-container">

      <div className="auth-card">

        <h1 className="app-title">Create Account</h1>
        <p className="subtitle">Start managing your HELB smarter.</p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Your username"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>

          <button className="primary-btn">Create Account</button>

          <p className="switch-text">
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>

        </form>

      </div>

    </div>

  )
}

export default Signup;
>>>>>>> d8aa9553451eaa167ee423c2bdcfdf218120443c
