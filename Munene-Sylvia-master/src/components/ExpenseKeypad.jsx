export default function ExpenseKeypad({ onInput }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  return (
    <div className="expense-keypad-grid">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onInput(key)}
          className="expense-keypad-btn"
        >
          {key}
        </button>
      ))}
    </div>
  );
}