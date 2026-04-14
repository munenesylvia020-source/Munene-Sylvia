import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { User, Phone, CheckCircle, TrendingUp, LogOut, ChevronRight, Wallet } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import '../styles/settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await auth.getProfile();
      setProfile(res);
      if (res.phone_number) {
        setPhone(res.phone_number);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!phone) {
      setError('Please enter a valid M-Pesa phone number');
      return;
    }
    
    const phoneRegex = /^(2547|2541)\d{8}$|^0(7|1)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('Invalid format. Must be 2547..., 2541..., 07..., or 01...');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setMessage('');
      await auth.updatePhone(phone);
      setMessage('Phone number updated successfully for M-Pesa interactions!');
      loadProfile(); 
    } catch (e) {
      setError(e.message || 'Failed to update phone number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-page"><div className="spinner"></div></div>;
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p className="subtitle">Manage your profile & preferences</p>
      </header>

      <div className="settings-content">
        <div className="profile-card card-glass">
          <div className="profile-avatar">
            <User size={32} color="var(--color-primary)" />
          </div>
          <div className="profile-info">
            <h2>{profile?.user?.first_name} {profile?.user?.last_name}</h2>
            <p>{profile?.user?.email}</p>
            <p className="institution">{profile?.institution_name}</p>
          </div>
        </div>

        <h3 className="section-title">M-Pesa Configuration</h3>
        <div className="settings-section card-glass">
          <p className="hint">Your M-Pesa phone number is required to process deposits and B2C withdrawals.</p>
          
          <div className="input-group">
            <Phone size={18} color="var(--color-text-muted)" className="input-icon" />
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="e.g. 254700000000"
              className="settings-input"
            />
          </div>
          
          {error && <p className="text-error mt-2">{error}</p>}
          {message && <p className="text-success mt-2" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle size={14}/> {message}</p>}

          <button 
            className="primary-btn mt-4" 
            onClick={handleUpdatePhone} 
            disabled={saving || !phone}
            style={{ width: '100%' }}
          >
            {saving ? 'Updating...' : 'Save Phone Number'}
          </button>
        </div>

        <h3 className="section-title">Preferences</h3>
        <div className="settings-list card-glass">
          <button className="settings-list-item" onClick={() => navigate('/daily-limit')}>
            <TrendingUp size={20} color="var(--color-accent)" />
            <div className="item-text">
              <h4>Daily Limit Settings</h4>
              <p>Configure automatic M-Pesa disbursements</p>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </button>
          <button className="settings-list-item" onClick={() => navigate('/income-sources')} style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '16px' }}>
            <Wallet size={20} color="var(--color-success)" />
            <div className="item-text">
              <h4>Income Engines</h4>
              <p>Track allowances, jobs, and side hustles</p>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        <h3 className="section-title mt-4">Developer Options</h3>
        <div className="settings-section card-glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4>Dev Mode (Mock Transactions)</h4>
              <p className="hint" style={{ margin: 0 }}>Enable to bypass real M-Pesa APIs for testing.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={localStorage.getItem('isMockMode') === 'true'} 
                onChange={(e) => {
                  localStorage.setItem('isMockMode', e.target.checked);
                  // Force re-render
                  setSaving(true);
                  setTimeout(() => setSaving(false), 50);
                }} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <button className="logout-btn card-glass" onClick={() => navigate('/logout')}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
