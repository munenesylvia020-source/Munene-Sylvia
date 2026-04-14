import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History, CheckCircle, Clock } from 'lucide-react';
import { helb } from '../services/api';

const HelbHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const [histRes, projRes] = await Promise.all([
          helb.getDisbursements().catch(() => []),
          helb.getProjections().catch(() => [])
        ]);
        setHistory(Array.isArray(histRes) ? histRes : (histRes.results || []));
        setProjections(Array.isArray(projRes) ? projRes : (projRes.results || []));
      } catch (err) {
        setError('Failed to fetch disbursement data.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="helb-history-container" style={{ padding: '20px', paddingBottom: '80px', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header className="helb-history-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}>
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.2rem', margin: 0 }}>Disbursement History</h1>
        <div style={{ width: 28 }} />
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}><div className="spinner"></div></div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {projections.length > 0 && (
            <div className="projections-section">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#bb86fc" /> Upcoming Cashflow Predictor
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projections.map(item => (
                  <div key={item.id} className="card-glass" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #bb86fc' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Expected: {new Date(item.projected_date).toLocaleDateString()}
                      </p>
                      <h3 style={{ margin: '4px 0 0 0', color: '#bb86fc' }}>
                        KES {parseFloat(item.projected_amount || 0).toLocaleString()}
                      </h3>
                    </div>
                    <div style={{ background: 'rgba(187, 134, 252, 0.1)', color: '#bb86fc', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {item.confidence_level} Confidence
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="history-section">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--color-primary)" /> Past Disbursements
            </h3>
            {history.length === 0 ? (
               <div className="empty-state" style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                 <p style={{ color: 'var(--color-text-muted)' }}>No logged disbursements found.</p>
               </div>
            ) : (
              <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map(item => (
                  <div key={item.id} className="card-glass" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(item.disbursal_date || item.expected_date).toLocaleDateString()}
                      </p>
                      <h3 style={{ margin: '4px 0 0 0', color: 'var(--color-primary)' }}>
                        KES {parseFloat(item.amount).toLocaleString()}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <CheckCircle size={14} />
                      {item.status || 'COMPLETED'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelbHistory;
