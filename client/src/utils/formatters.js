export function formatMs(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  return `${Number(value).toFixed(2)} ms`;
//   converts the value to a number and formate it to two decimal places
}
// display loacl time and date formate insted of raw ISO date
export function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString();
}