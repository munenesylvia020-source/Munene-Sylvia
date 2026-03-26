import { formatCurrency } from "../utils/budgetStore";

export default function CategoryCard({ title, amountLeft, total, spent = 0 }) {
  const safeTotal = Number(total) || 0;
  const safeAmountLeft = Number(amountLeft) || 0;
  const percent = safeTotal > 0 ? Math.max(0, Math.min(100, (safeAmountLeft / safeTotal) * 100)) : 0;

  return (
    <article className="category-card">
      <div className="category-row">
        <h3 className="category-title">{title}</h3>
        <span className="category-left">KES {formatCurrency(safeAmountLeft)}</span>
      </div>

      <div className="category-progress-track">
        <div
          className="category-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="category-total">
        Allocated: KES {formatCurrency(safeTotal)} | Spent: KES {formatCurrency(spent)}
      </p>
    </article>
  );
}