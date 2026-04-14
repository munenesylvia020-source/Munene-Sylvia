import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpenseKeypad from "../components/ExpenseKeypad";
import BottomNav from "../components/BottomNav";
import { budgetAllocation } from "../constants/budgetAllocation";
import { finance } from "../services/api";
import appLogo from '../assets/Penny Professor logo 1.png';
import { FiArrowLeft, FiEdit3, FiList, FiSave, FiTag, FiTrash2 } from "react-icons/fi";

export default function AddExpense() {
  const [amount, setAmount] = useState("");
  const categories = budgetAllocation.map(c => c.name);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "Other");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInput = (key) => {
    if (key === "⌫") {
      setAmount((prev) => prev.slice(0, -1));
      return;
    }

    if (key === ".") {
      setAmount((prev) => {
        if (prev.includes(".")) {
          return prev;
        }

        return prev.length === 0 ? "0." : prev + key;
      });
      return;
    }

    if (/\d/.test(key)) {
      setAmount((prev) => prev + key);
    } else {
      setAmount((prev) => prev);
    }
  };

  const clearAmount = () => setAmount("");

  const handleSaveExpense = async () => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      await finance.addExpense({
        amount: parsedAmount,
        category: selectedCategory,
        description: note || 'Expense'
      });
      setAmount("");
      setNote("");
      setError("");
      navigate("/activity");
    } catch (saveError) {
      setError(saveError.message || "Could not save expense to cloud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-page">
      <section className="expense-shell">
        <div className="expense-header-row">
           <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" />
          <h2 className="expense-title">
            <FiList className="expense-title-icon" />
            Quick Log Expense
          </h2>
         
        </div>
        <p className="expense-subtitle">Enter amount, then save to your spending log.</p>

        <div className="expense-fields">
          <label className="expense-field-label" htmlFor="expense-category">
            <FiTag className="expense-label-icon" />
            Category
          </label>
          <select
            id="expense-category"
            className="expense-select"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((catName) => (
              <option key={catName} value={catName}>
                {catName}
              </option>
            ))}
          </select>

          <label className="expense-field-label" htmlFor="expense-note">
            <FiEdit3 className="expense-label-icon" />
            Note (optional)
          </label>
          <input
            id="expense-note"
            className="expense-note-input"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Example: Lunch near campus"
          />
        </div>

        <h1 className="expense-amount">KES {amount || "0.00"}</h1>

        <ExpenseKeypad onInput={handleInput} />

        <div className="expense-actions">
          <button type="button" className="expense-clear-btn" onClick={clearAmount}>
            <FiTrash2 className="expense-btn-icon" />
            Clear
          </button>
          <button type="button" className="expense-save-btn" onClick={handleSaveExpense} disabled={loading}>
            <FiSave className="expense-btn-icon" />
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
         <button
            type="button"
            className="expense-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <FiArrowLeft className="expense-btn-icon" />
            Back to Dashboard
          </button>
        {error ? <p className="expense-error">{error}</p> : null}
      </section>

      <BottomNav />
    </div>
  );
}