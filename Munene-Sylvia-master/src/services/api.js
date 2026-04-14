import { auth as firebaseAuth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Check for firebase user token
  if (firebaseAuth.currentUser) {
    const token = await firebaseAuth.currentUser.getIdToken();
    defaultHeaders['Authorization'] = `Bearer ${token}`; // Use Bearer for Firebase Middleware
  } else {
    // Fallback to local storage token if not fully synced yet (or backend generated token)
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Token ${token}`;
    }
  }

  const config = {
    headers: defaultHeaders,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const validationError =
        errorData.detail ||
        errorData.error ||
        (typeof errorData === 'object' && Object.values(errorData)[0] ? Object.values(errorData)[0][0] : null) ||
        `HTTP Error: ${response.status}`;
      throw {
        status: response.status,
        message: validationError,
        data: errorData,
      };
    }
    return await response.json();
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 0,
      message: error.message || 'Network error',
      data: error,
    };
  }
};

export const auth = {
  login: async (email, password) => {
    // Firebase auth
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const firebase_token = await userCredential.user.getIdToken();

    // Pass token to backend for session map
    const data = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebase_token }),
    }).then(r => r.json());
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  signup: async (userData) => {
    // Firebase create
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, userData.password);
    const firebase_token = await userCredential.user.getIdToken();

    // Create tracking model on backend
    const data = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, firebase_token }),
    }).then(r => r.json());
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
      await apiCall('/auth/logout/', { method: 'POST' });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('helb_budget_data');
      localStorage.removeItem('helb_expenses_data');
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiCall('/auth/profile/', {
      method: 'GET',
    });
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async () => {
    const data = await apiCall('/auth/token/refresh/', {
      method: 'POST',
    });
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  /**
   * Update student M-Pesa phone number
   */
  updatePhone: async (phoneNumber) => {
    return apiCall('/auth/students/update_phone/', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },

  /**
   * Mark onboarding as complete
   */
  completeOnboarding: async () => {
    return apiCall('/finance/fund-sources/complete-onboarding/', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

/**
 * Finance API calls
 */
export const finance = {
  /**
   * Get all expenses
   */
  getExpenses: async (filters = {}) => {
    let queryString = '';
    if (Object.keys(filters).length > 0) {
      queryString = '?' + new URLSearchParams(filters).toString();
    }
    return apiCall(`/finance/expenses/${queryString}`, { method: 'GET' });
  },

  /**
   * Add new expense
   */
  addExpense: async (expenseData) => {
    return apiCall('/finance/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  /**
   * Get expense by ID
   */
  getExpense: async (id) => {
    return apiCall(`/finance/expenses/${id}/`, { method: 'GET' });
  },

  /**
   * Update expense
   */
  updateExpense: async (id, expenseData) => {
    return apiCall(`/finance/expenses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  /**
   * Delete expense
   */
  deleteExpense: async (id) => {
    return apiCall(`/finance/expenses/${id}/`, { method: 'DELETE' });
  },

  /**
   * Get budget information
   */
  getBudget: async () => {
    return apiCall('/finance/budget/', { method: 'GET' });
  },

  /**
   * Update budget
   */
  updateBudget: async (budgetData) => {
    return apiCall('/finance/budget/', {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  },

  // ============ M-Pesa Payment APIs ============

  /**
   * Get wallet information
   */
  getWallet: async () => {
    return apiCall('/finance/wallets/my_wallet/', { method: 'GET' });
  },

  /**
   * Initiate C2B deposit (send money to wallet)
   */
  initiateDeposit: async (phoneNumber, amount, reference = 'deposit', isMock = false) => {
    return apiCall('/finance/c2b/initiate/', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        reference: reference,
        is_mock: isMock,
      }),
    });
  },

  /**
   * Initiate B2C withdrawal (withdraw to M-Pesa)
   */
  initiateWithdrawal: async (phoneNumber, amount, purpose = 'BusinessPayment', isMock = false) => {
    return apiCall('/finance/b2c/initiate/', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        purpose: purpose,
        is_mock: isMock,
      }),
    });
  },

  /**
   * Get M-Pesa transaction history
   */
  getMpesaTransactions: async () => {
    return apiCall('/finance/mpesa-transactions/', { method: 'GET' });
  },

  /**
   * Get recent M-Pesa transactions
   */
  getRecentMpesaTransactions: async () => {
    return apiCall('/finance/mpesa-transactions/recent/', { method: 'GET' });
  },

  /**
   * Get B2C transaction history
   */
  getB2CTransactions: async () => {
    return apiCall('/finance/b2c-transactions/', { method: 'GET' });
  },

  /**
   * Get recent B2C transactions
   */
  getRecentB2CTransactions: async () => {
    return apiCall('/finance/b2c-transactions/recent/', { method: 'GET' });
  },

  /**
   * Check payment status
   */
  checkPaymentStatus: async (transactionId, type = 'c2b') => {
    return apiCall('/finance/payment-status/', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        type: type,
      }),
    });
  },

  /**
   * Get all transactions (wallet transactions)
   */
  getTransactions: async () => {
    return apiCall('/finance/transactions/', { method: 'GET' });
  },

  // ============ Daily Limit & Disbursement APIs ============

  /**
   * Get current daily limit for user
   */
  getDailyLimit: async () => {
    return apiCall('/finance/daily-limit/', { method: 'GET' });
  },

  /**
   * Set or update daily spending limit
   * @param {Object} limitData - {daily_amount, phone_number, disbursement_time, is_active}
   */
  setDailyLimit: async (limitData) => {
    return apiCall('/finance/daily-limit/set_limit/', {
      method: 'POST',
      body: JSON.stringify(limitData),
    });
  },

  /**
   * Get remaining daily limit for today
   */
  getTodayRemaining: async () => {
    return apiCall('/finance/daily-limit/today_remaining/', { method: 'GET' });
  },

  /**
   * Get history of daily disbursements
   */
  getDisbursementHistory: async () => {
    return apiCall('/finance/daily-limit/disbursement_history/', { method: 'GET' });
  },
  
  getBalanceSnapshots: async () => {
    return apiCall('/finance/balance-snapshots/', { method: 'GET' });
  },

  // ============ Fund Sources (Income Diversification) ============
  getFundSources: async () => {
    return apiCall('/finance/fund-sources/', { method: 'GET' });
  },
  addFundSource: async (data) => {
    return apiCall('/finance/fund-sources/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteFundSource: async (id) => {
    return apiCall(`/finance/fund-sources/${id}/`, { method: 'DELETE' });
  },
};

/**
 * HELB API calls
 */
export const helb = {
  getAccount: async () => {
    return apiCall('/helb/accounts/my_account/', { method: 'GET' });
  },
  getProjections: async () => {
    return apiCall('/helb/projections/', { method: 'GET' });
  },
  getDisbursements: async () => {
    return apiCall('/helb/disbursements/', { method: 'GET' });
  },
  getDisbursement: async (id) => {
    return apiCall(`/helb/disbursements/${id}/`, { method: 'GET' });
  },
  trackAmount: async (amount) => {
    return apiCall('/helb/track/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};

/**
 * Investments API calls
 */
export const investments = {
  getPortfolio: async () => {
    return apiCall('/investments/positions/portfolio_growth/', { method: 'GET' });
  },
  getPositions: async () => {
    return apiCall('/investments/positions/', { method: 'GET' });
  },
  getAccruals: async () => {
    return apiCall('/investments/accrual-logs/', { method: 'GET' });
  },
  getDailyForecast: async () => {
    return apiCall('/investments/positions/daily_accruals/', { method: 'GET' });
  }
};

export default apiCall;
