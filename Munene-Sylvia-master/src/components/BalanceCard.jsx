import { formatCurrency } from "../utils/budgetStore";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, GraduationCap } from "lucide-react";

export default function BalanceCard({ totalBalance = 0, walletBalance = 0, helbBalance = 0, onDeposit, onWithdraw }) {
  return (
    <div className="balance-card card-glass" style={{ marginBottom: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Total Balance</p>
      </div>
      <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, marginBottom: '16px' }}>
        <span style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text-secondary)', marginRight: '8px' }}>KES</span>
        {formatCurrency(totalBalance)}
      </h1>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wallet size={14} color="var(--color-primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px' }}>Amount Deposited</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(walletBalance)}</strong>
          </div>
        </div>
        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GraduationCap size={14} color="var(--color-secondary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px' }}>HELB Remaining</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(helbBalance)}</strong>
          </div>
        </div>
      </div>

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