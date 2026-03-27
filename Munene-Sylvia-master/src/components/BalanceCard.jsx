import { formatCurrency } from "../utils/budgetStore";

export default function BalanceCard({ totalBalance = 0, totalAmount = 0, totalSpent = 0 }) {
  return (
    <div className="balance-card">
      <p className="balance-label">TOTAL BALANCE</p>
      <h1 className="balance-value">KES {formatCurrency(totalBalance)}</h1>

      <p className="balance-chip">
        Loan: KES {formatCurrency(totalAmount)} | Spent: KES {formatCurrency(totalSpent)}
      </p>
    </div>
  );
}