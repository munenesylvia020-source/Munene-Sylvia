export const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString();
};