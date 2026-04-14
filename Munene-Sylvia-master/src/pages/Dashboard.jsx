import { useState, useEffect } from "react";
import BalanceCard from "../components/BalanceCard";
import CategoryCard from "../components/CategoryCard";
import BottomNav from "../components/BottomNav";
import DepositModal from "../components/DepositModal";
import WithdrawalModal from "../components/WithdrawalModal";
import AIChatWidget from "../components/AIChatWidget";
import { useNavigate } from "react-router-dom";
import { finance, helb } from "../services/api";
import { Bell, PlusCircle, User, LogOut, Download, Upload, TrendingUp, ShieldCheck } from "lucide-react";

import appLogo from '../assets/Penny Professor logo 1.png';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ categories: [], totalAmount: 0, totalSpent: 0, totalRemaining: 0, expenses: [] });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [realBalance, setRealBalance] = useState(0);
  const [walletBal, setWalletBal] = useState(0);
  const [helbBal, setHelbBal] = useState(0);
  const [todayRemaining, setTodayRemaining] = useState(0);
  const [dailyLimitActive, setDailyLimitActive] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [mpesaTransactions, setMpesaTransactions] = useState([]);
  const [loadingMpesa, setLoadingMpesa] = useState(false);
  const [mpesaError, setMpesaError] = useState('');
  const [b2cTransactions, setB2cTransactions] = useState([]);
  const [loadingB2c, setLoadingB2c] = useState(false);
  const [b2cError, setB2cError] = useState('');
  const [isPollingMpesa, setIsPollingMpesa] = useState(false);
  const [isPollingB2c, setIsPollingB2c] = useState(false);

  useEffect(() => {
    loadSummary();
    loadWalletBalance();
    loadDailyLimitInfo();
    loadMpesaTransactions();
    loadB2cTransactions();
  }, []);

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const [budgetRes, expensesRes] = await Promise.all([
        finance.getBudget().catch(() => ({})),
        finance.getExpenses().catch(() => [])
      ]);
      
      const exps = Array.isArray(expensesRes) ? expensesRes : [];
      let mappedCategories = [
        { name: 'Rent', amount: Number(budgetRes.accommodation_limit || 0) },
        { name: 'Food', amount: Number(budgetRes.food_limit || 0) },
        { name: 'Tuition & Academic', amount: Number(budgetRes.education_limit || 0) },
        { name: 'Personal', amount: Number(budgetRes.entertainment_limit || 0) },
        { name: 'Savings', amount: Number(budgetRes.other_limit || 0) }
      ];
      
      // Calculate spent per category
      const expensesByCategory = exps.reduce((acc, exp) => {
        const key = exp.category || "Other";
        acc[key] = (acc[key] || 0) + Number(exp.amount);
        return acc;
      }, {});

      const datesObj = budgetRes.category_due_dates || {};

      mappedCategories = mappedCategories.map(cat => ({
        ...cat,
        allocated: cat.amount,
        spent: expensesByCategory[cat.name] || 0,
        remaining: Math.max(0, cat.amount - (expensesByCategory[cat.name] || 0)),
        dueDate: datesObj[cat.name] || null
      }));
      
      const totalAmount = mappedCategories.reduce((sum, c) => sum + c.amount, 0);
      const totalSpent = exps.reduce((sum, e) => sum + Number(e.amount), 0);
      
      setSummary({
        categories: mappedCategories,
        totalAmount,
        totalSpent,
        totalRemaining: Math.max(0, totalAmount - totalSpent),
        expenses: exps
      });
    } catch(err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const [walletResp, helbResp] = await Promise.all([
        finance.getWallet().catch(() => ({ balance: 0 })),
        helb.getAccount().catch(() => ({ remaining_balance: 0 }))
      ]);
      const bal = Array.isArray(walletResp) ? walletResp[0]?.balance : walletResp?.balance;
      const hBal = helbResp?.remaining_balance || 0;
      setWalletBal(Number(bal || 0));
      setHelbBal(Number(hBal || 0));
      setRealBalance(Number(bal || 0) + Number(hBal || 0));
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const loadDailyLimitInfo = async () => {
    try {
      setLoadingDaily(true);
      const response = await finance.getTodayRemaining();
      setTodayRemaining(response.remaining || 0);
      setDailyLimitActive(response.is_active || false);
    } catch (error) {
      console.error('Error loading daily limit:', error);
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadMpesaTransactions = async () => {
    try {
      if(!isPollingMpesa) setLoadingMpesa(true);
      setMpesaError('');
      const response = await finance.getRecentMpesaTransactions();
      const txs = response || [];
      setMpesaTransactions(txs);
      
      // Auto-poll if any are pending
      if (txs.some(tx => tx.status && tx.status.toUpperCase() === 'PENDING')) {
        setIsPollingMpesa(true);
      } else {
        if(isPollingMpesa) loadWalletBalance(); // The moment polling finishes successfully, forcefully refresh the wallet balance!
        setIsPollingMpesa(false);
      }
    } catch (error) {
      setMpesaError('Unable to load M-Pesa transactions right now.');
      setIsPollingMpesa(false);
    } finally {
      setLoadingMpesa(false);
    }
  };

  const loadB2cTransactions = async () => {
    try {
      if(!isPollingB2c) setLoadingB2c(true);
      setB2cError('');
      const response = await finance.getRecentB2CTransactions();
      const txs = response || [];
      setB2cTransactions(txs);

      if (txs.some(tx => tx.status && tx.status.toUpperCase() === 'PENDING')) {
        setIsPollingB2c(true);
      } else {
        if(isPollingB2c) loadWalletBalance(); // refresh wallet when withdrawal finishes
        setIsPollingB2c(false);
      }
    } catch (error) {
      setB2cError('Unable to load withdrawal transactions right now.');
      setIsPollingB2c(false);
    } finally {
      setLoadingB2c(false);
    }
  };

  // Polling Effects
  useEffect(() => {
    let interval;
    if (isPollingMpesa) interval = setInterval(() => { loadMpesaTransactions(); }, 5000);
    return () => clearInterval(interval);
  }, [isPollingMpesa]);

  useEffect(() => {
    let interval;
    if (isPollingB2c) interval = setInterval(() => { loadB2cTransactions(); }, 5000);
    return () => clearInterval(interval);
  }, [isPollingB2c]);

  const handleDeposit = () => setDepositModalOpen(true);
  const handleWithdraw = () => setWithdrawalModalOpen(true);

  const handleDepositSuccess = () => { 
    loadMpesaTransactions(); 
    loadWalletBalance(); 
  };
  const handleWithdrawalSuccess = async (data) => { 
    if (data && data.amount) {
        try {
            await finance.addExpense({ amount: Number(data.amount), category: 'Other', description: 'M-Pesa Withdrawal' });
            loadSummary(); // Refresh envelopes securely
        } catch(e) { console.error('Failed to update expense', e); }
    }
    loadB2cTransactions(); 
    loadWalletBalance(); 
    loadDailyLimitInfo();
  };

  const handleSetDueDate = async (categoryName, dateValue) => {
    try {
      const currentRes = await finance.getBudget();
      const existingDates = currentRes.category_due_dates || {};
      existingDates[categoryName] = dateValue;
      await finance.updateBudget({ category_due_dates: existingDates });
      loadSummary();
    } catch (e) {
      console.error("Failed to update due date", e);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-shell">
        {/* Header */}
        <div className="dashboard-toolbar">
          <button type="button" className="dashboard-icon-btn" aria-label="Profile"><User size={20} /></button>
          <button type="button" className="dashboard-icon-btn" aria-label="Notifications"><Bell size={20} /></button>
          <button type="button" className="dashboard-icon-btn" aria-label="Logout" onClick={() => navigate('/logout')}>
            <LogOut size={20} />
          </button>
        </div>

        <div className="dashboard-header-row">
          <div>
            <h2 className="dashboard-title">Penny Professor</h2>
            <p className="dashboard-subtitle">Your Money, Your Future.</p>
          </div>
          <button type="button" className="primary-btn dashboard-add-btn" onClick={() => navigate("/add")}>
            <PlusCircle size={18} /> Add
          </button>
        </div>


        <BalanceCard 
          totalBalance={realBalance} 
          walletBalance={walletBal}
          helbBalance={helbBal}
          onDeposit={() => setDepositModalOpen(true)} 
          onWithdraw={() => setWithdrawalModalOpen(true)} 
        />

        {/* Helb Shortcut CTA */}
        <div className="card-glass helb-shortcut" onClick={() => navigate('/helb-amount')}>
          <div className="helb-shortcut-content">
            <ShieldCheck size={28} className="text-success" />
            <div>
              <h3>HELB Tracker</h3>
              <p>View your disbursements & projections.</p>
            </div>
          </div>
        </div>

        {/* Daily Limit Section */}
        {dailyLimitActive && !loadingDaily && (
          <div className="transactions-section card-glass">
            <div className="section-header">
              <h3><TrendingUp size={18} /> Daily Limit Remaining</h3>
              <button 
                className="text-btn" 
                onClick={() => navigate("/daily-limit")}
                style={{color: "var(--color-primary)", background: "transparent"}}
              >
                Settings
              </button>
            </div>
            <p className="daily-remaining-amount">
              KES {todayRemaining.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {!dailyLimitActive && !loadingDaily && (
          <div className="transactions-section card-glass">
            <h3><TrendingUp size={18} /> Daily Spending Limit</h3>
            <p className="hint">Set a daily spending limit and get automatic M-Pesa disbursements</p>
            <button type="button" className="primary-btn mt-2" onClick={() => navigate("/daily-limit")}>
              Set Daily Limit
            </button>
          </div>
        )}

        <h3 className="section-title">Envelopes</h3>
        {loadingSummary ? (
          <p className="hint text-center">Syncing cloud envelopes...</p>
        ) : (
          <div className="dashboard-categories">
            {summary.categories.map((category) => (
              <CategoryCard
                key={category.name}
                title={category.name}
                amountLeft={category.remaining}
                total={category.allocated}
                spent={category.spent}
                dueDate={category.dueDate}
                onSetDueDate={(val) => handleSetDueDate(category.name, val)}
              />
            ))}
          </div>
        )}

        {/* Transactions */}
        <div className="transactions-section card-glass mt-4">
          <div className="section-header">
            <h3><Download size={18} className="text-success" /> Recent Deposits</h3>
          </div>
          {loadingMpesa ? (
            <p className="hint text-center">Loading deposits...</p>
          ) : mpesaTransactions.length === 0 ? (
             <p className="hint text-center">No deposits found yet</p>
          ) : (
            <div className="transactions-list">
              {mpesaTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-info">
                    <strong>{tx.reference || tx.mpesa_code || 'Deposit'}</strong>
                    <small>{new Date(tx.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="tx-amt">
                    <span className="text-success">+KES {Number(tx.amount).toLocaleString('en-KE')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="transactions-section card-glass mt-4">
          <div className="section-header">
             <h3><Upload size={18} className="text-error" /> Withdrawals</h3>
          </div>
          {loadingB2c ? (
            <p className="hint text-center">Loading withdrawals...</p>
          ) : b2cTransactions.length === 0 ? (
             <p className="hint text-center">No withdrawals yet</p>
          ) : (
            <div className="transactions-list">
              {b2cTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-info">
                    <strong>{tx.phone_number}</strong>
                    <small>{new Date(tx.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="tx-amt">
                    <span className="text-error">-KES {Number(tx.amount).toLocaleString('en-KE')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} onSuccess={handleDepositSuccess} />
      <WithdrawalModal isOpen={withdrawalModalOpen} onClose={() => setWithdrawalModalOpen(false)} onSuccess={handleWithdrawalSuccess} walletBalance={realBalance} dailyLimitActive={dailyLimitActive} todayRemaining={todayRemaining} studentInfo={{}} />

      <AIChatWidget mpesaTransactions={mpesaTransactions} b2cTransactions={b2cTransactions} />
      <BottomNav />
    </div>
  );
}