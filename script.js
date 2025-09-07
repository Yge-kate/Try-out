// Financial Status Tracker - Main JavaScript File
class FinancialTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.savingsGoal = parseFloat(localStorage.getItem('savingsGoal')) || 0;
        this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateMonthSelector();
        this.updateDashboard();
        this.updateTransactionsList();
        this.updateMonthlySummary();
        this.initializeCharts();
        this.setCurrentDate();
        this.updateSavingsGoalDisplay();
    }

    setupEventListeners() {
        // Income form
        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Savings goal
        document.getElementById('setSavingsGoal').addEventListener('click', () => {
            this.setSavingsGoal();
        });

        // Month selector
        document.getElementById('monthSelector').addEventListener('change', (e) => {
            this.currentMonth = e.target.value || new Date().toISOString().slice(0, 7);
            this.updateDashboard();
            this.updateTransactionsList();
            this.updateMonthlySummary();
            this.updateCharts();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = today;
        document.getElementById('expenseDate').value = today;
    }

    populateMonthSelector() {
        const selector = document.getElementById('monthSelector');
        const currentDate = new Date();
        
        // Add current month as default
        selector.innerHTML = '<option value="">Current Month</option>';
        
        // Add last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthValue = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            selector.innerHTML += `<option value="${monthValue}">${monthName}</option>`;
        }
    }

    addIncome() {
        const source = document.getElementById('incomeSource').value;
        const amount = parseFloat(document.getElementById('incomeAmount').value);
        const date = document.getElementById('incomeDate').value;

        if (!source || !amount || !date) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        const transaction = {
            id: Date.now(),
            type: 'income',
            source,
            amount,
            date,
            month: date.slice(0, 7)
        };

        this.transactions.push(transaction);
        this.saveData();
        this.updateDashboard();
        this.updateTransactionsList();
        this.updateMonthlySummary();
        this.updateCharts();
        
        // Reset form
        document.getElementById('incomeForm').reset();
        this.setCurrentDate();
        
        this.showToast(`Income of $${amount.toFixed(2)} added successfully!`, 'success');
    }

    addExpense() {
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const date = document.getElementById('expenseDate').value;

        if (!category || !description || !amount || !date) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        const transaction = {
            id: Date.now(),
            type: 'expense',
            category,
            description,
            amount,
            date,
            month: date.slice(0, 7)
        };

        this.transactions.push(transaction);
        this.saveData();
        this.updateDashboard();
        this.updateTransactionsList();
        this.updateMonthlySummary();
        this.updateCharts();
        
        // Reset form
        document.getElementById('expenseForm').reset();
        this.setCurrentDate();
        
        this.showToast(`Expense of $${amount.toFixed(2)} added successfully!`, 'success');
    }

    setSavingsGoal() {
        const goal = parseFloat(document.getElementById('savingsGoal').value);
        
        if (!goal || goal <= 0) {
            this.showToast('Please enter a valid savings goal', 'error');
            return;
        }

        this.savingsGoal = goal;
        localStorage.setItem('savingsGoal', goal.toString());
        this.updateSavingsGoalDisplay();
        this.updateDashboard();
        
        this.showToast(`Savings goal set to $${goal.toFixed(2)}!`, 'success');
    }

    updateSavingsGoalDisplay() {
        const currentSavings = this.getCurrentSavings();
        const progress = this.savingsGoal > 0 ? (currentSavings / this.savingsGoal) * 100 : 0;
        
        document.getElementById('goalProgress').style.width = `${Math.min(progress, 100)}%`;
        
        if (this.savingsGoal > 0) {
            document.getElementById('goalText').textContent = 
                `$${currentSavings.toFixed(2)} of $${this.savingsGoal.toFixed(2)} (${progress.toFixed(1)}%)`;
        } else {
            document.getElementById('goalText').textContent = 'Set your savings goal to track progress';
        }
    }

    getCurrentSavings() {
        const monthlyTransactions = this.getMonthlyTransactions();
        const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return income - expenses;
    }

    getMonthlyTransactions() {
        return this.transactions.filter(t => t.month === this.currentMonth);
    }

    updateDashboard() {
        const monthlyTransactions = this.getMonthlyTransactions();
        const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const savings = income - expenses;

        // Update display values
        document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('netSavings').textContent = `$${savings.toFixed(2)}`;

        // Calculate budget status
        const budgetPercentage = this.savingsGoal > 0 ? (expenses / (income || 1)) * 100 : 0;
        const budgetStatus = budgetPercentage > 80 ? 'Over Budget' : budgetPercentage > 60 ? 'Close to Limit' : 'On Track';
        
        document.getElementById('budgetStatus').textContent = budgetStatus;
        document.getElementById('budgetPercentage').textContent = `${budgetPercentage.toFixed(1)}% spent`;

        // Calculate month-over-month changes
        this.updateMonthlyChanges(income, expenses, savings);
        this.updateSavingsGoalDisplay();
    }

    updateMonthlyChanges(currentIncome, currentExpenses, currentSavings) {
        const lastMonth = this.getPreviousMonth();
        const lastMonthTransactions = this.transactions.filter(t => t.month === lastMonth);
        const lastIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const lastExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const lastSavings = lastIncome - lastExpenses;

        // Calculate percentage changes
        const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
        const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;
        const savingsChange = lastSavings !== 0 ? ((currentSavings - lastSavings) / Math.abs(lastSavings)) * 100 : 0;

        // Update display
        document.getElementById('incomeChange').textContent = `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}% from last month`;
        document.getElementById('expenseChange').textContent = `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}% from last month`;
        document.getElementById('savingsChange').textContent = `${savingsChange >= 0 ? '+' : ''}${savingsChange.toFixed(1)}% from last month`;

        // Update colors based on change
        document.getElementById('incomeChange').style.color = incomeChange >= 0 ? '#81c784' : '#f48fb1';
        document.getElementById('expenseChange').style.color = expenseChange <= 0 ? '#81c784' : '#f48fb1';
        document.getElementById('savingsChange').style.color = savingsChange >= 0 ? '#81c784' : '#f48fb1';
    }

    getPreviousMonth() {
        const currentDate = new Date(this.currentMonth + '-01');
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        return previousMonth.toISOString().slice(0, 7);
    }

    updateTransactionsList() {
        const transactionsList = document.getElementById('transactionsList');
        const monthlyTransactions = this.getMonthlyTransactions()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10); // Show last 10 transactions

        if (monthlyTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-inbox"></i>
                    <p>No transactions yet. Add your first income or expense above!</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = monthlyTransactions.map(transaction => {
            const isIncome = transaction.type === 'income';
            const title = isIncome ? transaction.source : transaction.description;
            const category = isIncome ? 'Income' : transaction.category;
            const amount = isIncome ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`;
            const amountClass = isIncome ? 'income' : 'expense';
            const date = new Date(transaction.date).toLocaleDateString();

            return `
                <div class="transaction-item slide-in">
                    <div class="transaction-info">
                        <div class="transaction-title">${title}</div>
                        <div class="transaction-category">${category}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${amount}</div>
                </div>
            `;
        }).join('');
    }

    updateMonthlySummary() {
        const monthlyTransactions = this.getMonthlyTransactions();
        const incomeSources = new Set(monthlyTransactions.filter(t => t.type === 'income').map(t => t.source)).size;
        const expenseCategories = new Set(monthlyTransactions.filter(t => t.type === 'expense').map(t => t.category)).size;
        const totalTransactions = monthlyTransactions.length;
        
        const totalExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const daysInMonth = new Date(new Date(this.currentMonth + '-01').getFullYear(), new Date(this.currentMonth + '-01').getMonth() + 1, 0).getDate();
        const avgDailySpending = totalExpenses / daysInMonth;

        document.getElementById('incomeSources').textContent = incomeSources;
        document.getElementById('expenseCategories').textContent = expenseCategories;
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('avgDailySpending').textContent = `$${avgDailySpending.toFixed(2)}`;
    }

    initializeCharts() {
        this.initExpenseChart();
        this.initTrendChart();
    }

    initExpenseChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        this.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4fc3f7',
                        '#f48fb1',
                        '#81c784',
                        '#ffb74d',
                        '#ba68c8',
                        '#4db6ac',
                        '#ff8a65',
                        '#90a4ae',
                        '#a1c181'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category',
                        color: '#4fc3f7',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });

        this.updateCharts();
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Income',
                    data: [],
                    borderColor: '#81c784',
                    backgroundColor: 'rgba(129, 199, 132, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: [],
                    borderColor: '#f48fb1',
                    backgroundColor: 'rgba(244, 143, 177, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Income vs Expenses Trend',
                        color: '#4fc3f7',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        this.updateExpenseChart();
        this.updateTrendChart();
    }

    updateExpenseChart() {
        const monthlyTransactions = this.getMonthlyTransactions();
        const expenses = monthlyTransactions.filter(t => t.type === 'expense');
        
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        this.expenseChart.data.labels = labels;
        this.expenseChart.data.datasets[0].data = data;
        this.expenseChart.update();
    }

    updateTrendChart() {
        // Get last 6 months of data
        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            
            const monthTransactions = this.transactions.filter(t => t.month === monthKey);
            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            months.push(monthName);
            incomeData.push(income);
            expenseData.push(expenses);
        }

        this.trendChart.data.labels = months;
        this.trendChart.data.datasets[0].data = incomeData;
        this.trendChart.data.datasets[1].data = expenseData;
        this.trendChart.update();
    }

    exportData() {
        const monthlyTransactions = this.getMonthlyTransactions();
        
        if (monthlyTransactions.length === 0) {
            this.showToast('No data to export for this month', 'error');
            return;
        }

        const csvContent = this.generateCSV(monthlyTransactions);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `financial-data-${this.currentMonth}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.showToast('Data exported successfully!', 'success');
    }

    generateCSV(transactions) {
        const headers = ['Date', 'Type', 'Category/Source', 'Description', 'Amount'];
        const rows = transactions.map(t => [
            t.date,
            t.type,
            t.type === 'income' ? t.source : t.category,
            t.type === 'income' ? t.source : t.description,
            t.amount.toFixed(2)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    saveData() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinancialTracker();
});