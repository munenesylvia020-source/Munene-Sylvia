import { budgetAllocation } from "../constants/budgetAllocation";

const STORAGE_KEYS = {
  budget: "helb_budget_data",
  expenses: "helb_expenses_data"
};

const FALLBACK_TOTAL = 22000;

const parseJSON = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const buildDefaultCategories = (totalAmount) => {
  return budgetAllocation.map((category, index) => {
    if (index === budgetAllocation.length - 1) {
      const allocatedBeforeLast = budgetAllocation
        .slice(0, -1)
        .reduce((sum, item) => sum + Math.floor((totalAmount * item.percentage) / 100), 0);

      return {
        ...category,
        amount: Math.max(0, totalAmount - allocatedBeforeLast)
      };
    }

    return {
      ...category,
      amount: Math.floor((totalAmount * category.percentage) / 100)
    };
  });
};

export const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString();
};

export const saveBudget = ({ totalAmount, categories }) => {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const safeCategories = Array.isArray(categories)
    ? categories.map((category) => ({
      ...category,
      amount: Math.max(0, Math.round(Number(category.amount) || 0)),
      percentage: Number(category.percentage) || 0
    }))
    : [];

  const payload = {
    totalAmount: safeTotal,
    categories: safeCategories,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(payload));
  return payload;
};

export const getBudget = () => {
  return parseJSON(localStorage.getItem(STORAGE_KEYS.budget), null);
};

export const getBudgetOrDefault = () => {
  const saved = getBudget();

  if (saved && Number(saved.totalAmount) > 0 && Array.isArray(saved.categories) && saved.categories.length > 0) {
    return {
      totalAmount: Number(saved.totalAmount),
      categories: saved.categories.map((category) => ({
        ...category,
        amount: Math.max(0, Math.round(Number(category.amount) || 0)),
        percentage: Number(category.percentage) || 0
      }))
    };
  }

  return {
    totalAmount: FALLBACK_TOTAL,
    categories: buildDefaultCategories(FALLBACK_TOTAL)
  };
};

export const getExpenses = () => {
  const parsed = parseJSON(localStorage.getItem(STORAGE_KEYS.expenses), []);
  return Array.isArray(parsed) ? parsed : [];
};

export const addExpense = ({ amount, category, note }) => {
  const safeAmount = Number(amount);

  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  const expense = {
    id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    amount: Number(safeAmount.toFixed(2)),
    category: category || "Other",
    note: (note || "").trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [expense, ...getExpenses()];
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(updated));
  return expense;
};

export const getDashboardSummary = () => {
  const budget = getBudgetOrDefault();
  const expenses = getExpenses();

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const key = expense.category || "Other";
    const amount = Number(expense.amount) || 0;
    acc[key] = (acc[key] || 0) + amount;
    return acc;
  }, {});

  const categories = budget.categories.map((category) => {
    const allocated = Number(category.amount) || 0;
    const spent = Number(expensesByCategory[category.name]) || 0;
    const remaining = Math.max(0, allocated - spent);

    return {
      ...category,
      allocated,
      spent,
      remaining
    };
  });

  const totalSpent = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  return {
    totalAmount: budget.totalAmount,
    totalSpent,
    totalRemaining: Math.max(0, budget.totalAmount - totalSpent),
    categories,
    expenses
  };
};