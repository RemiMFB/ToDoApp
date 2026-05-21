/**
 * Personal Expense Tracker - Data Management Module
 * Focuses 100% on data persistence and analysis logic.
 * Exposes functions globally in the browser environment.
 */

const STORAGE_KEY = 'personal_expense_tracker_expenses';

/**
 * Safely reads the expenses list from localStorage.
 * Handles parsing errors gracefully.
 * @returns {Array} List of expenses
 */
function safeGetExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse expenses from localStorage:', e);
    return [];
  }
}

/**
 * Safely writes the expenses list to localStorage.
 * Handles serialization errors gracefully.
 * @param {Array} expenses List of expenses to save
 */
function safeSetExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses to localStorage:', e);
  }
}

/**
 * Returns the complete list of expense objects from localStorage.
 * If empty, returns [].
 * @returns {Array} List of expenses
 */
function getExpenses() {
  return safeGetExpenses();
}

/**
 * Accepts an object { amount, category, note, date }.
 * Validates that amount is a positive number.
 * Generates a unique string or number id if not present.
 * Stores the expense into localStorage (combining with existing list).
 * Returns the added expense.
 * @param {Object} expense Expense object to add
 * @returns {Object} The added expense
 */
function addExpense(expense) {
  if (!expense || typeof expense !== 'object') {
    throw new Error('Expense must be a valid object');
  }

  const amount = Number(expense.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Expense amount must be a positive number');
  }

  // Generate unique string ID using timestamp and a random string
  const id = expense.id || 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

  const expenses = safeGetExpenses();
  const newExpense = {
    id: id,
    amount: amount,
    category: expense.category || '其它',
    note: expense.note ? String(expense.note).trim() : '',
    date: expense.date || new Date().toISOString().split('T')[0]
  };

  expenses.push(newExpense);
  safeSetExpenses(expenses);
  return newExpense;
}

/**
 * Deletes the expense with the matching id from the list in localStorage.
 * @param {string|number} id Unique identifier of the expense
 */
function deleteExpense(id) {
  if (id === undefined || id === null) return;
  const expenses = safeGetExpenses();
  const filtered = expenses.filter(item => String(item.id) !== String(id));
  safeSetExpenses(filtered);
}

/**
 * Computes and returns the sum of amounts of all expenses in the current calendar month.
 * @returns {number} Sum of amounts
 */
function getMonthlyTotal() {
  const expenses = safeGetExpenses();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  return expenses
    .filter(item => {
      if (!item.date) return false;
      // Parse YYYY-MM-DD format
      const parts = item.date.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        return year === currentYear && month === currentMonth;
      }
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && 
             d.getFullYear() === currentYear && 
             (d.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
}

/**
 * Groups expenses by category and returns an object summarizing the total expense for each category.
 * @returns {Object} Grouped totals
 */
function getExpensesByCategory() {
  const expenses = safeGetExpenses();
  const result = {
    '飲食': 0,
    '交通': 0,
    '娛樂': 0,
    '購物': 0,
    '其它': 0
  };
  expenses.forEach(item => {
    const cat = item.category || '其它';
    if (result.hasOwnProperty(cat)) {
      result[cat] += parseFloat(item.amount || 0);
    } else {
      result[cat] = parseFloat(item.amount || 0);
    }
  });
  return result;
}

// Bind to window/global scope for script tag inclusion
if (typeof window !== 'undefined') {
  window.getExpenses = getExpenses;
  window.addExpense = addExpense;
  window.deleteExpense = deleteExpense;
  window.getMonthlyTotal = getMonthlyTotal;
  window.getExpensesByCategory = getExpensesByCategory;
} else if (typeof global !== 'undefined') {
  global.getExpenses = getExpenses;
  global.addExpense = addExpense;
  global.deleteExpense = deleteExpense;
  global.getMonthlyTotal = getMonthlyTotal;
  global.getExpensesByCategory = getExpensesByCategory;
}
