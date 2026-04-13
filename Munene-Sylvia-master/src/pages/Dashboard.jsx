import { useState, useEffect } from "react";
import BalanceCard from "../components/BalanceCard";
import CategoryCard from "../components/CategoryCard";
import BottomNav from "../components/BottomNav";
import DepositModal from "../components/DepositModal";
import WithdrawalModal from "../components/WithdrawalModal";
import AIChatWidget from "../components/AIChatWidget";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../utils/budgetStore";
import { finance } from "../services/api";
import { Bell, PlusCircle, User, LogOut, Download, Upload, TrendingUp, ShieldCheck } from "lucide-react";

import appLogo from '../assets/Penny Professor logo 1.png';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const summary = getDashboardSummary();
  const [realBalance, setRealBalance] = useState(0);
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
    loadWalletBalance();
    loadDailyLimitInfo();
    loadMpesaTransactions();
    loadB2cTransactions();
  }, []);

  const loadWalletBalance = async () => {
    try {
      const resp = await finance.getWallet();
      const bal = Array.isArray(resp) ? resp[0]?.balance : resp?.balance;
      setRealBalance(Number(bal || 0));
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
  const handleWithdrawalSuccess = () => { 
    loadB2cTransactions(); 
    loadWalletBalance(); 
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

        {/* Balance Card */}
        <BalanceCard
          balance={realBalance}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
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
        <div className="dashboard-categories">
          {summary.categories.map((category) => (
            <CategoryCard
              key={category.name}
              title={category.name}
              amountLeft={category.remaining}
              total={category.allocated}
              spent={category.spent}
            />
          ))}
        </div>

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
      <WithdrawalModal isOpen={withdrawalModalOpen} onClose={() => setWithdrawalModalOpen(false)} onSuccess={handleWithdrawalSuccess} walletBalance={realBalance} studentInfo={{}} />

      <AIChatWidget mpesaTransactions={mpesaTransactions} b2cTransactions={b2cTransactions} />
      <BottomNav />
    </div>
  );
}