import { formatCurrency } from "../utils/budgetStore";
import { Home, Utensils, GraduationCap, PiggyBank, Car, Film, Zap, PieChart, CalendarDays } from "lucide-react";

export default function CategoryCard({ title, amountLeft, total, spent = 0, dueDate, onSetDueDate }) {
  const safeTotal = Number(total) || 0;
  const safeAmountLeft = Number(amountLeft) || 0;
  const safeSpent = Number(spent) || 0;
  const percent = safeTotal > 0 ? Math.max(0, Math.min(100, (safeAmountLeft / safeTotal) * 100)) : 0;

  let colorVar = "var(--color-primary)";
  if (percent < 20) colorVar = "var(--color-error)";
  else if (percent < 50) colorVar = "var(--color-warning)";

  return (
    <article className="card-glass" style={{ padding: 'var(--spacing-4)', marginBottom: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--color-glass-icon)', padding: '10px', borderRadius: '12px' }}>
            {getCategoryIcon(title)}
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</h3>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>KES {formatCurrency(safeAmountLeft)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)' }}>
          <CalendarDays size={14} color="var(--color-text-muted)" />
          {dueDate ? (
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => onSetDueDate?.(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '11px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            />
          ) : (
            <button 
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onSetDueDate?.(today);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Set Due Date
            </button>
          )}
        </div>
      </div>

      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-background)', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: colorVar, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)' }}>
        <span>Spent: KES {formatCurrency(safeSpent)}</span>
        <span>{Math.round(percent)}% left</span>
      </div>
    </article>
  );
}

function getCategoryIcon(title) {
  const props = { size: 18, color: "var(--color-text-primary)" };
  switch(title) {
    case 'Rent': return <Home {...props} />;
    case 'Food': return <Utensils {...props} />;
    case 'Tuition': return <GraduationCap {...props} />;
    case 'Savings': return <PiggyBank {...props} />;
    case 'Transport': return <Car {...props} />;
    case 'Entertainment': return <Film {...props} />;
    case 'Utilities': return <Zap {...props} />;
    default: return <PieChart {...props} />;
  }
}