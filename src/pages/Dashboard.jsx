import BalanceCard from "../components/BalanceCard";
import CategoryCard from "../components/CategoryCard";
import BottomNav from "../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../utils/budgetStore";
import { FiBell, FiPlusCircle, FiUser } from "react-icons/fi";

import appLogo from '../assets/Penny Professor logo 1.png';     

export default function Dashboard() {
  const navigate = useNavigate();
  const summary = getDashboardSummary();

  return (
    <div className="dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-toolbar">
          <button type="button" className="dashboard-icon-btn" aria-label="Profile">
            <FiUser />
          </button>
          <button type="button" className="dashboard-icon-btn" aria-label="Notifications">
            <FiBell />
          </button>
        </div>

        <div className="dashboard-header-row">
          <div className="dashboard-header">
             <img src={appLogo} alt="Penny Professor logo" className="allocation-logo" />
            <h2 className="dashboard-title">My Funds</h2>
            <p className="dashboard-subtitle">
              Monitor each category and log your spending quickly.
            </p>
          </div>
          <button
            type="button"
            className="dashboard-add-expense-btn"
            onClick={() => navigate("/add")}
          >
            <FiPlusCircle className="btn-icon" />
            Add Expense
          </button>
        </div>

        <BalanceCard
          totalBalance={summary.totalRemaining}
          totalAmount={summary.totalAmount}
          totalSpent={summary.totalSpent}
        />

        <div className="dashboard-categories">
          {summary.categories.map((category) => (
            <CategoryCard
              key={category.name}
              title={category.name}
              amountLeft={category.remaining}
              total={category.allocated}
              spent={category.spent}
            />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}