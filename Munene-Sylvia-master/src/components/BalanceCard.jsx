import { formatCurrency } from "../utils/budgetStore";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function BalanceCard({ balance = 0, onDeposit, onWithdraw }) {
  return (
    <div className="balance-card card-glass" style={{ marginBottom: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Total Balance</p>
      </div>
      <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, marginBottom: '24px' }}>
        <span style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text-secondary)', marginRight: '8px' }}>KES</span>
        {formatCurrency(balance)}
      </h1>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onDeposit} style={{ 
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)',
          padding: '12px', borderRadius: 'var(--radius-lg)', fontWeight: 600
        }}>
          <ArrowDownToLine size={18} /> Deposit
        </button>
        <button onClick={onWithdraw} style={{ 
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-error)',
          padding: '12px', borderRadius: 'var(--radius-lg)', fontWeight: 600
        }}>
          <ArrowUpFromLine size={18} /> Withdraw
        </button>
      </div>
    </div>
  );
}