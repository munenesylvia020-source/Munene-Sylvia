import BottomNav from "../components/BottomNav";
import { formatCurrency, getExpenses } from "../utils/budgetStore";
import appLogo from '../assets/Penny Professor logo 1.png';

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
};

export default function Activity() {
  const expenses = getExpenses();

  return (
    <div className="activity-page">
      <section className="activity-shell">
        <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" /> 
        <h1 className="activity-title">Expense Activity</h1>
        <p className="activity-subtitle">Recent transactions logged from your dashboard.</p>

        {expenses.length === 0 ? (
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
                  <p className="activity-amount">KES {formatCurrency(expense.amount)}</p>
                  <p className="activity-date">{formatDateTime(expense.createdAt)}</p>
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
