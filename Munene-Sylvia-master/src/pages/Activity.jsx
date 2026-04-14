import BottomNav from "../components/BottomNav";
import { useState, useEffect } from "react";
import { finance } from "../services/api";
import appLogo from '../assets/Penny Professor logo 1.png';

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
};

export default function Activity() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await finance.getExpenses();
        setExpenses(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load cloud expenses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  return (
    <div className="activity-page">
      <section className="activity-shell">
        <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" /> 
        <h1 className="activity-title">Expense Activity</h1>
        <p className="activity-subtitle">Recent transactions logged from your dashboard.</p>

        {loading ? (
          <div className="activity-empty"><p>Loading cloud expenses...</p></div>
        ) : expenses.length === 0 ? (
          <div className="activity-empty">
            <p>No expenses logged yet.</p>
            <p>Use the Add page to create your first expense entry.</p>
          </div>
        ) : (
          <div className="activity-list">
            {expenses.map((expense) => (
              <article key={expense.id} className="activity-item">
                <div className="activity-item-main">
                  <h2 className="activity-category">{expense.category}</h2>
                  <p className="activity-note">{expense.note || "No note provided"}</p>
                </div>
                <div className="activity-item-side">
                  <p className="activity-amount">KES {Number(expense.amount).toLocaleString()}</p>
                  <p className="activity-date">{formatDateTime(expense.date || expense.created_at)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
