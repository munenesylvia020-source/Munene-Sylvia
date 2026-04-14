import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { finance, helb } from '../services/api';
import '../styles/dashboard.css';

const PRESET_COLORS = ['#6366f1', '#00e676', '#f59e0b', '#ec4899', '#38bdf8', '#8b5cf6'];

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [snapshotData, setSnapshotData] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, net: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [c2b, b2c, disbursements, expenses, snapshots] = await Promise.all([
          finance.getRecentMpesaTransactions().catch(() => ({ results: [] })),
          finance.getRecentB2CTransactions().catch(() => ({ results: [] })),
          helb.getDisbursements().catch(() => ({ results: [] })),
          finance.getExpenses().catch(() => ({ results: [] })),
          finance.getBalanceSnapshots().catch(() => ({ results: [] }))
        ]);

        const c2bData = Array.isArray(c2b) ? c2b : (c2b.results || []);
        const b2cData = Array.isArray(b2c) ? b2c : (b2c.results || []);
        const disData = Array.isArray(disbursements) ? disbursements : (disbursements.results || []);
        const expData = Array.isArray(expenses) ? expenses : (expenses.results || []);
        const snapData = Array.isArray(snapshots) ? snapshots : (snapshots.results || []);

        // Build Cashflow Timeline
        let timeline = {};
        
        c2bData.forEach(tx => {
          const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!timeline[date]) timeline[date] = { date, income: 0, expense: 0 };
          timeline[date].income += Number(tx.amount || 0);
        });

        disData.forEach(tx => {
          if (!tx.disbursal_date && !tx.expected_date) return;
          const date = new Date(tx.disbursal_date || tx.expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!timeline[date]) timeline[date] = { date, income: 0, expense: 0 };
          timeline[date].income += Number(tx.amount || 0);
        });

        b2cData.forEach(tx => {
          const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!timeline[date]) timeline[date] = { date, income: 0, expense: 0 };
          timeline[date].expense += Number(tx.amount || 0);
        });

        expData.forEach(tx => {
          const date = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!timeline[date]) timeline[date] = { date, income: 0, expense: 0 };
          timeline[date].expense += Number(tx.amount || 0);
        });

        const sortedFlow = Object.values(timeline).sort((a,b) => new Date(a.date) - new Date(b.date));
        setCashFlowData(sortedFlow);

        // Aggregate Expense Totals
        let totalInc = 0; let totalExp = 0;
        sortedFlow.forEach(d => { totalInc += d.income; totalExp += d.expense; });
        setTotals({ income: totalInc, expenses: totalExp, net: totalInc - totalExp });

        // Category Breakdown
        let cats = {};
        expData.forEach(tx => {
          const c = tx.category || 'Other';
          cats[c] = (cats[c] || 0) + Number(tx.amount);
        });
        setExpenseData(Object.keys(cats).map(k => ({ name: k, value: cats[k] })));

        // Snapshots Data
        const formattedSnapshots = snapData.map(s => ({
          date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          balance: Number(s.balance)
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        setSnapshotData(formattedSnapshots);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--color-text-primary)' }}>
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.2rem', margin: 0 }}>Analytics</h1>
        <div style={{ width: 28 }} />
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card-glass" style={{ display: 'flex', justifyContent: 'space-between' }}>
             <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid var(--color-border)'}}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>Income</p>
                <h3 style={{ color: 'var(--color-success)', margin: '4px 0', fontSize: '1.2rem' }}>+{totals.income.toLocaleString()}</h3>
             </div>
             <div style={{ flex: 1, textAlign: 'center'}}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>Expenses</p>
                <h3 style={{ color: 'var(--color-error)', margin: '4px 0', fontSize: '1.2rem' }}>-{totals.expenses.toLocaleString()}</h3>
             </div>
          </div>

          <div className="card-glass">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <TrendingUp size={16} /> Cash Flow Overview
            </h3>
            <div style={{ height: 220, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e676" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={10} tickFormatter={(value) => `KES ${value/1000}k`} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-glass)' }} />
                  <Area type="monotone" dataKey="income" stroke="#00e676" fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-glass">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <DollarSign size={16} /> Wealth Over Time
            </h3>
            {snapshotData.length > 0 ? (
               <div style={{ height: 220, width: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={snapshotData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="var(--color-text-muted)" fontSize={10} tickFormatter={(v) => `KES ${v/1000}k`} tickLine={false} axisLine={false} />
                     <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-glass)' }} />
                     <Area type="monotone" dataKey="balance" stroke="#38bdf8" fillOpacity={1} fill="url(#colorBalance)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            ) : (
                 <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '40px 0' }}>Not enough historical balance data. Check back tomorrow!</p>
            )}
          </div>

          <div className="card-glass">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={16} /> Spending Breakdown
            </h3>
            {expenseData.length > 0 ? (
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRESET_COLORS[index % PRESET_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-glass)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '40px 0' }}>No expense data to analyze yet.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
