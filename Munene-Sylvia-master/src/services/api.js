/**
 * API Service - Handles all HTTP requests to the backend
 * Base URL is configurable via environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Helper function to make API requests
 */
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Token ${token}`;
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
    // Re-throw fetch errors
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: error.message || 'Network error',
      data: error,
    };
  }
};

/**
 * Authentication API calls
 */
export const auth = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{token: string, user: Object}>}
   */
  login: async (email, password) => {
    const data = await apiCall('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  /**
   * Register new user
   * @param {Object} userData - {email, password, first_name, last_name, etc.}
   * @returns {Promise<{token: string, user: Object}>}
   */
  signup: async (userData) => {
    const data = await apiCall('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiCall('/auth/logout/', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('authToken');
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
    return apiCall('/finance/wallets/', { method: 'GET' });
  },

  /**
   * Initiate C2B deposit (send money to wallet)
   */
  initiateDeposit: async (phoneNumber, amount, reference = 'deposit') => {
    return apiCall('/finance/c2b/initiate/', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        reference: reference,
      }),
    });
  },

  /**
   * Initiate B2C withdrawal (withdraw to M-Pesa)
   */
  initiateWithdrawal: async (phoneNumber, amount, purpose = 'BusinessPayment') => {
    return apiCall('/finance/b2c/initiate/', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        purpose: purpose,
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
};

/**
 * HELB API calls
 */
export const helb = {
  /**
   * Get HELB disbursement status
   */
  getDisbursements: async () => {
    return apiCall('/helb/disbursements/', { method: 'GET' });
  },

  /**
   * Get specific disbursement
   */
  getDisbursement: async (id) => {
    return apiCall(`/helb/disbursements/${id}/`, { method: 'GET' });
  },

  /**
   * Track HELB amount
   */
  trackAmount: async (amount) => {
    return apiCall('/helb/track/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};

export default apiCall;
