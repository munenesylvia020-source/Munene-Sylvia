import { formatCurrency } from "../utils/budgetStore";

export default function CategoryCard({ title, amountLeft, total, spent = 0 }) {
  const safeTotal = Number(total) || 0;
  const safeAmountLeft = Number(amountLeft) || 0;
  const safeSpent = Number(spent) || 0;
  const percent = safeTotal > 0 ? Math.max(0, Math.min(100, (safeAmountLeft / safeTotal) * 100)) : 0;

  // Determine status based on spending
  const getStatus = () => {
    if (safeSpent === 0) return 'unused';
    if (percent > 50) return 'good';
    if (percent > 20) return 'warning';
    return 'danger';
  };

  const status = getStatus();

  return (
    <article className={`category-card category-card--${status}`}>
      <div className="category-header">
        <div className="category-icon">
          {getCategoryIcon(title)}
        </div>
        <div className="category-info">
          <h3 className="category-title">{title}</h3>
          <span className="category-left">KES {formatCurrency(safeAmountLeft)}</span>
        </div>
      </div>

      <div className="category-progress">
        <div className="category-progress-track">
          <div
            className="category-progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="category-percent">{Math.round(percent)}%</span>
      </div>

      <div className="category-details">
        <span className="category-spent">Spent: KES {formatCurrency(safeSpent)}</span>
        <span className="category-total">Total: KES {formatCurrency(safeTotal)}</span>
      </div>
    </article>
  );
}

function getCategoryIcon(title) {
  const icons = {
    'Rent': '🏠',
    'Food': '🍽️',
    'Tuition': '🎓',
    'Savings': '💰',
    'Transport': '🚗',
    'Entertainment': '🎬',
    'Utilities': '⚡'
  };

  return icons[title] || '📊';
}