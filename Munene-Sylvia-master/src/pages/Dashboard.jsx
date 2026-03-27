import { useState, useEffect } from "react";
import BalanceCard from "../components/BalanceCard";
import CategoryCard from "../components/CategoryCard";
import BottomNav from "../components/BottomNav";
import DepositModal from "../components/DepositModal";
import WithdrawalModal from "../components/WithdrawalModal";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../utils/budgetStore";
import { finance } from "../services/api";
import { FiBell, FiPlusCircle, FiUser, FiLogOut, FiDownload, FiUpload, FiTrendingUp, FiCreditCard } from "react-icons/fi";

import appLogo from '../assets/Penny Professor logo 1.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const summary = getDashboardSummary();
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

  useEffect(() => {
    loadDailyLimitInfo();
    loadMpesaTransactions();
    loadB2cTransactions();
  }, []);

  const loadDailyLimitInfo = async () => {
    try {
      setLoadingDaily(true);
      const response = await finance.getTodayRemaining();
      setTodayRemaining(response.remaining || 0);
      setDailyLimitActive(response.is_active || false);
    } catch (error) {
      console.error('Error loading daily limit:', error);
      // Silently fail - daily limit is optional
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadMpesaTransactions = async () => {
    try {
      setLoadingMpesa(true);
      setMpesaError('');
      const response = await finance.getRecentMpesaTransactions();
      setMpesaTransactions(response || []);
    } catch (error) {
      console.error('Error loading M-Pesa transactions:', error);
      setMpesaError('Unable to load M-Pesa transactions right now.');
    } finally {
      setLoadingMpesa(false);
    }
  };

  const loadB2cTransactions = async () => {
    try {
      setLoadingB2c(true);
      setB2cError('');
      const response = await finance.getRecentB2CTransactions();
      setB2cTransactions(response || []);
    } catch (error) {
      console.error('Error loading B2C transactions:', error);
      setB2cError('Unable to load withdrawal transactions right now.');
    } finally {
      setLoadingB2c(false);
    }
  };

  const handleDeposit = () => {
    setDepositModalOpen(true);
  };

  const handleWithdraw = () => {
    setWithdrawalModalOpen(true);
  };

  const handleDepositSuccess = () => {
    setDepositModalOpen(false);
    loadMpesaTransactions(); // Refresh transactions
  };

  const handleWithdrawalSuccess = () => {
    setWithdrawalModalOpen(false);
    loadB2cTransactions(); // Refresh transactions
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-shell">
        {/* Header */}
        <div className="dashboard-toolbar">
          <button type="button" className="dashboard-icon-btn" aria-label="Profile">
            <FiUser />
          </button>
          <button type="button" className="dashboard-icon-btn" aria-label="Notifications">
            <FiBell />
          </button>
          <button
            type="button"
            className="dashboard-icon-btn"
            aria-label="Logout"
            onClick={() => navigate('/logout')}
          >
            <FiLogOut />
          </button>
        </div>

        <div className="dashboard-header-row">
          <div>
            <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" />
            <h2 className="dashboard-title">My Funds</h2>
            <p className="dashboard-subtitle">
              Monitor each category and log your spending quickly.
            </p>
          </div>
          <button
            type="button"
            className="dashboard-add-expense-btn"
            onClick={() => navigate("/add")}
          >
            <FiPlusCircle className="btn-icon" />
            Add Expense
          </button>
        </div>

        {/* Balance Card */}
        <BalanceCard
          balance={summary.totalRemaining}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />

        {/* Daily Limit Section */}
        {dailyLimitActive && !loadingDaily && (
          <div className="transactions-section">
            <h3>
              <FiTrendingUp />
              Daily Limit Remaining
            </h3>
            <div className="daily-limit-content">
              <div className="daily-limit-text">
                <p className="daily-remaining-amount">
                  KES {todayRemaining.toLocaleString('en-KE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/daily-limit")}
              >
                Settings
              </button>
            </div>
          </div>
        )}

        {/* Setup Daily Limit CTA */}
        {!dailyLimitActive && !loadingDaily && (
          <div className="transactions-section">
            <h3>
              <FiTrendingUp />
              Daily Spending Limit
            </h3>
            <p>Set a daily spending limit and get automatic M-Pesa disbursements</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/daily-limit")}
            >
              Set Daily Limit
            </button>
          </div>
        )}

        {/* Categories */}
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

        {/* M-Pesa Transactions */}
        <div className="transactions-section">
          <h3>
            <FiDownload />
            Recent Deposits
          </h3>
          {loadingMpesa ? (
            <div className="loading-container">
              <span>Loading deposits...</span>
            </div>
          ) : mpesaError ? (
            <div className="error-text">{mpesaError}</div>
          ) : mpesaTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-text">No deposits found yet</div>
              <div className="empty-state-action" onClick={handleDeposit}>
                Make your first deposit
              </div>
            </div>
          ) : (
            <div className="transactions-list">
              {mpesaTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-info">
                    <p><strong>{tx.reference || tx.mpesa_code || 'Deposit'}</strong></p>
                    <p className="transaction-date">
                      {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-amount">
                      +KES {Number(tx.amount).toLocaleString('en-KE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className={`transaction-status status-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* B2C Transactions */}
        <div className="transactions-section">
          <h3>
            <FiUpload />
            Recent Withdrawals
          </h3>
          {loadingB2c ? (
            <div className="loading-container">
              <span>Loading withdrawals...</span>
            </div>
          ) : b2cError ? (
            <div className="error-text">{b2cError}</div>
          ) : b2cTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-text">No withdrawals yet</div>
              <div className="empty-state-action" onClick={handleWithdraw}>
                Make your first withdrawal
              </div>
            </div>
          ) : (
            <div className="transactions-list">
              {b2cTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-info">
                    <p><strong>{tx.phone_number}</strong></p>
                    <p className="transaction-date">
                      {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-amount">
                      -KES {Number(tx.amount).toLocaleString('en-KE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className={`transaction-status status-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />

      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        onSuccess={handleWithdrawalSuccess}
        walletBalance={summary.totalRemaining}
        studentInfo={{}}
      />

      <BottomNav />
    </div>
  );
}