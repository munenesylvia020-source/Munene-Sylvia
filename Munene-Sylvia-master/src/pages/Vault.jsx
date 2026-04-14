import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, Activity, BarChart3 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { investments } from '../services/api';
import '../styles/vault.css';

const Vault = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [accruals, setAccruals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVaultData() {
      try {
        setLoading(true);
        const [portResp, posResp, accResp] = await Promise.all([
          investments.getPortfolio().catch(() => null),
          investments.getPositions().catch(() => []),
          investments.getAccruals().catch(() => [])
        ]);

        if (portResp) setPortfolio(portResp);
        if (posResp) setPositions(Array.isArray(posResp) ? posResp : []);
        if (accResp) setAccruals(Array.isArray(accResp) ? accResp : []);
      } catch (err) {
        console.error("Vault data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadVaultData();
  }, []);

  // Format accruals for the chart
  const chartData = accruals.length > 0 
    ? [...accruals].reverse().map(a => ({
        date: new Date(a.accrual_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: Number(a.value_after)
      }))
    : [ // Fallback mock data if empty
        { date: 'Mon', value: 20000 },
        { date: 'Tue', value: 20015 },
        { date: 'Wed', value: 20032 },
        { date: 'Thu', value: 20050 },
        { date: 'Fri', value: 20075 },
      ];

  const totalValue = portfolio?.total_current_value || positions.reduce((sum, p) => sum + Number(p.current_value), 0) || 0;
  const totalGained = portfolio?.total_gained || 0;

  return (
    <div className="vault-page">
      <header className="vault-header">
        <div>
          <h1 className="vault-title">The Vault</h1>
          <p className="vault-subtitle">Your locked funds, growing daily.</p>
        </div>
        <Shield size={28} color="#bb86fc" />
      </header>

      <div className="vault-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
        ) : (
          <>
            <div className="portfolio-card">
              <div className="portfolio-label">Total Vault Balance</div>
              <div className="portfolio-balance">
                KES {Number(totalValue).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </div>
              
              <div className="growth-stats">
                <div className="stat-item">
                  <span className="stat-value positive">
                    +{Number(totalGained).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="stat-label">Total Profit</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value positive">
                    +{portfolio?.total_gained_percentage ? Number(portfolio.total_gained_percentage).toFixed(2) : '0.00'}%
                  </span>
                  <span className="stat-label">All-time Return</span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-title"><Activity size={18} color="#03dac6" /> Growth Trajectory</div>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#bb86fc" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#bb86fc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e28', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#03dac6', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#bb86fc" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="positions-container">
              <h3 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} /> Active Assets
              </h3>
              
              {positions.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>No locked funds right now. Complete a HELB import to activate the Vault.</p>
                </div>
              ) : (
                <div className="positions-list">
                  {positions.map(pos => (
                    <div key={pos.id} className="position-card">
                      <div className="position-info">
                        <h4>{pos.fund_name}</h4>
                        <p>{pos.fund_type}</p>
                      </div>
                      <div className="position-value">
                        <h4>{Number(pos.current_value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</h4>
                        <span className="yield">+{Number(pos.annual_yield_percentage)}% AEY</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Vault;
