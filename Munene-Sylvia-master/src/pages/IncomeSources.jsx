import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Trash2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { finance } from '../services/api';
import '../styles/incomeSources.css';

export default function IncomeSources() {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    source_type: 'OTHER',
    amount: '',
    frequency: 'MONTHLY',
    description: ''
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const res = await finance.getFundSources();
      setSources(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error loading fund sources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    if (parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await finance.addFundSource({
        ...formData,
        amount: parseFloat(formData.amount),
        is_active: true
      });
      setFormData({ source_type: 'OTHER', amount: '', frequency: 'MONTHLY', description: '' });
      await loadSources();
    } catch (err) {
      console.error("Failed to add source:", err);
      alert("Failed to add income source. Please check the inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await finance.deleteFundSource(id);
      setSources(sources.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="income-sources-page">
      <header className="income-header">
        <button onClick={() => navigate('/settings')} className="text-btn">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="income-title">Income Engines</h1>
          <p className="income-subtitle">Diversify beyond HELB.</p>
        </div>
        <Wallet size={24} color="var(--color-primary)" />
      </header>

      <div className="income-content">
        <div className="add-source-form">
          <h3 style={{marginTop: 0, marginBottom: '16px'}}>Add New Income</h3>
          <form onSubmit={handleAdd}>
            <div className="form-group mb-3">
              <input
                type="text"
                className="form-input"
                placeholder="Description (e.g., Mom, Bakery Hustle)"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-col">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Amount (KES)"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-col">
                <select 
                  className="form-input"
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="SEMESTER">Per Semester</option>
                  <option value="ONE_TIME">One-time</option>
                </select>
              </div>
            </div>
            <button type="submit" className="primary-btn w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : <><PlusCircle size={18} /> Add Source</>}
            </button>
          </form>
        </div>

        <h3 className="section-title">Active Streams</h3>
        {loading ? (
          <p className="text-center hint">Loading sources...</p>
        ) : sources.length === 0 ? (
          <div className="empty-state">
            <p className="hint">No additional income streams tracked yet. Diversify your portfolio!</p>
          </div>
        ) : (
          <div className="sources-list">
            {sources.map(source => (
              <div className="source-item" key={source.id}>
                <div className="source-details">
                  <h4>{source.description}</h4>
                  <p>{source.frequency.toLowerCase()}</p>
                </div>
                <div className="source-actions">
                  <span className="source-amount">+KES {Number(source.amount).toLocaleString()}</span>
                  <button onClick={() => handleDelete(source.id)} className="delete-btn" aria-label="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
