/**
 * ==========================================================================
 * Personal Expense Tracker - Core UI Logic (app.js)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // DOM Element Selection
    // ----------------------------------------------------------------------
    const expenseForm = document.getElementById('expense-form');
    const amountInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');
    const noteInput = document.getElementById('expense-note');
    const categoryFilter = document.getElementById('category-filter');
    const recordsList = document.getElementById('records-list');
    const emptyState = document.getElementById('empty-state');
    const monthlyTotalValue = document.getElementById('monthly-total-value');
    const recordCount = document.getElementById('record-count');
    const currentMonthBadge = document.getElementById('current-month-badge');
    const categoryRadios = document.querySelectorAll('input[name="category"]');

    // ----------------------------------------------------------------------
    // Local / Mock Data Layer Fallback
    // ----------------------------------------------------------------------
    // If data.js is not loaded or doesn't define the necessary operations,
    // we fallback to a fully functional localStorage implementation so that the
    // UI remains completely interactive and testable on its own.
    const mockDataKey = 'expense_tracker_mock_data';

    const getMockExpenses = () => {
        const data = localStorage.getItem(mockDataKey);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Error parsing mock expenses data:", e);
            }
        }
        // Seed initial mock data if empty
        const initialSeed = [
            { id: 'mock-1', amount: 120, category: '飲食', note: '香雞排與大杯珍奶', date: getFormattedDate(0) },
            { id: 'mock-2', amount: 350, category: '娛樂', note: '威秀影城電影票', date: getFormattedDate(-1) },
            { id: 'mock-3', amount: 80, category: '交通', note: '捷運加值', date: getFormattedDate(-2) },
            { id: 'mock-4', amount: 1590, category: '購物', note: '運動鞋', date: getFormattedDate(-3) }
        ];
        localStorage.setItem(mockDataKey, JSON.stringify(initialSeed));
        return initialSeed;
    };

    const saveMockExpenses = (expenses) => {
        localStorage.setItem(mockDataKey, JSON.stringify(expenses));
    };

    // Helper to get formatted date relative to today
    function getFormattedDate(daysOffset = 0) {
        const target = new Date();
        target.setDate(target.getDate() + daysOffset);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Checking existence of global data layer functions
    const isDataLayerReady = () => {
        return typeof getExpenses === 'function' &&
               typeof addExpense === 'function' &&
               typeof deleteExpense === 'function' &&
               typeof getMonthlyTotal === 'function';
    };

    // Print status log to console for debugging
    if (isDataLayerReady()) {
        console.log("Expense Tracker UI: Global data layer (data.js) detected successfully!");
    } else {
        console.warn("Expense Tracker UI: Global data layer functions are missing. Falling back to Mock Storage.");
    }

    // Defensive wrappers around data operations
    const getExpensesData = () => {
        if (isDataLayerReady()) {
            return getExpenses();
        }
        return getMockExpenses();
    };

    const addExpenseData = (expense) => {
        if (isDataLayerReady()) {
            return addExpense(expense);
        }
        const expenses = getMockExpenses();
        const newExpense = {
            ...expense,
            id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)
        };
        expenses.push(newExpense);
        saveMockExpenses(expenses);
        return newExpense;
    };

    const deleteExpenseData = (id) => {
        if (isDataLayerReady()) {
            return deleteExpense(id);
        }
        let expenses = getMockExpenses();
        expenses = expenses.filter(item => item.id !== id);
        saveMockExpenses(expenses);
    };

    const getMonthlyTotalData = () => {
        if (isDataLayerReady()) {
            return getMonthlyTotal();
        }
        // Fallback calculations for current calendar month
        const expenses = getMockExpenses();
        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        return expenses
            .filter(item => item.date && item.date.startsWith(currentYearMonth))
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    // ----------------------------------------------------------------------
    // Formatting & Utility Helpers
    // ----------------------------------------------------------------------
    // Formats numbers cleanly into Currency layout (e.g. 15,200)
    function formatCurrency(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    }

    // Escapes special characters to prevent HTML/XSS injection
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ----------------------------------------------------------------------
    // UI Event Handlers & View Renderers
    // ----------------------------------------------------------------------
    
    // Updates the "Active" category pill styling class (JS fail-safe for older browsers)
    function updateActiveCategoryPill() {
        categoryRadios.forEach(radio => {
            const label = radio.closest('.category-pill-label');
            if (label) {
                if (radio.checked) {
                    label.classList.add('js-active');
                } else {
                    label.classList.remove('js-active');
                }
            }
        });
    }

    // Recalculates and updates the total display
    function updateMonthlyTotalDisplay() {
        const total = getMonthlyTotalData();
        monthlyTotalValue.textContent = formatCurrency(total);
    }

    // Renders the list items onto the screen
    function renderExpenseRecords() {
        const expenses = getExpensesData();
        const activeFilter = categoryFilter.value;

        // Sort items: Latest Date first. If dates are equal, sort by id descending
        const sortedExpenses = [...expenses].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }
            // Secondary sort
            return String(b.id).localeCompare(String(a.id));
        });

        // Apply category filter
        const filteredExpenses = activeFilter === '全部'
            ? sortedExpenses
            : sortedExpenses.filter(item => item.category === activeFilter);

        // Update total counter badge
        recordCount.textContent = `${filteredExpenses.length} 筆`;

        // Clear existing list elements
        recordsList.innerHTML = '';

        if (filteredExpenses.length === 0) {
            recordsList.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            recordsList.style.display = 'flex';
            emptyState.style.display = 'none';

            filteredExpenses.forEach(item => {
                const li = document.createElement('li');
                li.className = 'record-item';
                li.setAttribute('data-category', item.category);
                li.setAttribute('data-id', item.id);

                // Set Lucide Icon name dynamically based on selected Category
                let iconName = 'more-horizontal';
                if (item.category === '飲食') iconName = 'utensils-2';
                else if (item.category === '交通') iconName = 'car';
                else if (item.category === '娛樂') iconName = 'gamepad-2';
                else if (item.category === '購物') iconName = 'shopping-bag';

                li.innerHTML = `
                    <div class="record-left">
                        <div class="category-icon-wrapper">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div class="record-details">
                            <span class="record-note">${escapeHTML(item.note) || item.category}</span>
                            <div class="record-meta">
                                <span class="record-date">${item.date}</span>
                                <span class="record-badge">${item.category}</span>
                            </div>
                        </div>
                    </div>
                    <div class="record-right">
                        <span class="record-amount">- $${formatCurrency(item.amount)}</span>
                        <button class="btn-delete" data-id="${item.id}" aria-label="刪除記帳紀錄">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `;
                recordsList.appendChild(li);
            });

            // Re-render Lucide Icons for dynamic HTML injection
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    // ----------------------------------------------------------------------
    // Validation Logic
    // ----------------------------------------------------------------------
    function validateField(inputEl, condition, errorMsgEl) {
        const formRow = inputEl.closest('.form-row');
        if (condition) {
            formRow.classList.remove('error');
            return true;
        } else {
            formRow.classList.add('error');
            return false;
        }
    }

    // ----------------------------------------------------------------------
    // Event Listeners
    // ----------------------------------------------------------------------

    // Sync pill active highlights when user changes category
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', updateActiveCategoryPill);
    });

    // Handle filter dropdown changes
    categoryFilter.addEventListener('change', () => {
        renderExpenseRecords();
    });

    // Handle single element deletion with a smooth micro-animation
    recordsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (!deleteBtn) return;

        const recordId = deleteBtn.getAttribute('data-id');
        const recordItem = deleteBtn.closest('.record-item');

        if (recordId && recordItem) {
            // Trigger exit slide micro-animation
            recordItem.classList.add('animate-delete');

            // Wait for animation to finish before actual state changes
            recordItem.addEventListener('animationend', () => {
                deleteExpenseData(recordId);
                renderExpenseRecords();
                updateMonthlyTotalDisplay();
            }, { once: true });
        }
    });

    // Validate inputs on input events for fluid feedback
    amountInput.addEventListener('input', () => {
        const val = parseFloat(amountInput.value);
        validateField(amountInput, !isNaN(val) && val > 0);
    });

    dateInput.addEventListener('input', () => {
        validateField(dateInput, dateInput.value !== '');
    });

    // Form Submission
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Perform validations
        const amountVal = parseFloat(amountInput.value);
        const isAmountValid = validateField(amountInput, !isNaN(amountVal) && amountVal > 0);
        const isDateValid = validateField(dateInput, dateInput.value !== '');

        if (!isAmountValid || !isDateValid) {
            // Focus on first invalid input
            if (!isAmountValid) {
                amountInput.focus();
            } else if (!isDateValid) {
                dateInput.focus();
            }
            return;
        }

        // Get values
        const amount = amountVal;
        const date = dateInput.value;
        const note = noteInput.value.trim();
        
        // Find checked category
        let category = '其它';
        const checkedRadio = document.querySelector('input[name="category"]:checked');
        if (checkedRadio) {
            category = checkedRadio.value;
        }

        // Save transaction to data layer
        addExpenseData({ amount, category, note, date });

        // Reset fields (except date, we reset date to today's date)
        amountInput.value = '';
        noteInput.value = '';
        
        // Clear validation statuses
        document.querySelectorAll('.form-row').forEach(row => row.classList.remove('error'));

        // Reset inputs to standard state
        initDefaultDate();
        
        // Update total card & transaction list view
        updateMonthlyTotalDisplay();
        renderExpenseRecords();
    });

    // ----------------------------------------------------------------------
    // Initialization
    // ----------------------------------------------------------------------
    function initDefaultDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        // Set date input value to today in local timezone format
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        
        // Update header month badge to show Current Year & Month (e.g. 2026 年 5 月)
        currentMonthBadge.textContent = `${yyyy} 年 ${parseInt(mm)} 月`;
    }

    function init() {
        // Render initial icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Sync pills
        updateActiveCategoryPill();

        // Setup dates
        initDefaultDate();

        // Initial render & total aggregation
        renderExpenseRecords();
        updateMonthlyTotalDisplay();
    }

    // Run core initialization
    init();
});
