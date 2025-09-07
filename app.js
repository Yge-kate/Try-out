(function () {
  const body = document.body;
  const themeToggleButton = document.getElementById('toggle-theme');
  const dateInput = document.getElementById('tx-date');
  const emptyState = document.getElementById('empty-state');
  const tableBody = document.getElementById('transactions-body');
  const summaryIncome = document.getElementById('summary-income');
  const summaryExpenses = document.getElementById('summary-expenses');
  const summaryBalance = document.getElementById('summary-balance');
  const filterMonth = document.getElementById('filter-month');
  const filterSearch = document.getElementById('filter-search');
  const exportBtn = document.getElementById('btn-export');
  const importInput = document.getElementById('input-import');
  const loadBtn = document.getElementById('btn-load-sample');
  const form = document.getElementById('transaction-form');
  const inputDesc = document.getElementById('tx-desc');
  const inputCategory = document.getElementById('tx-category');
  const inputAmount = document.getElementById('tx-amount');
  const inputType = document.getElementById('tx-type');

  const STORAGE_KEY_TX = 'ft_transactions_v1';
  const STORAGE_KEY_THEME = 'ft_theme';

  let transactions = [];
  let editingId = null;
  let categoryChart = null;
  let balanceChart = null;

  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: detectCurrency() });

  function detectCurrency() {
    // Best-effort guess based on locale
    try {
      const region = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || 'US';
      switch (region.toUpperCase()) {
        case 'GB': return 'GBP';
        case 'EU':
        case 'DE':
        case 'FR': return 'EUR';
        case 'IN': return 'INR';
        case 'JP': return 'JPY';
        case 'BR': return 'BRL';
        case 'AU': return 'AUD';
        case 'CA': return 'CAD';
        default: return 'USD';
      }
    } catch (_) {
      return 'USD';
    }
  }

  function formatCurrency(value) {
    return currency.format(value);
  }

  function parseAmount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function generateId() {
    return 'tx_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function normalizeDate(yyyyMmDd) {
    // Ensure valid YYYY-MM-DD
    const d = new Date(yyyyMmDd);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  function getMonthKey(yyyyMmDd) {
    return yyyyMmDd.slice(0, 7);
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    } catch (_) {
      return 'dark';
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (_) {}
  }

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    themeToggleButton.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function initTheme() {
    const theme = getSavedTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  function setTodayOnDateInput() {
    if (!dateInput) return;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    if (filterMonth && !filterMonth.value) {
      filterMonth.value = `${yyyy}-${mm}`;
    }
  }

  function clearTable() {
    if (tableBody) tableBody.innerHTML = '';
  }

  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TX);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((t) => ({
        id: String(t.id || generateId()),
        date: normalizeDate(t.date),
        description: String(t.description || ''),
        category: String(t.category || ''),
        amount: Number(t.amount) || 0,
        type: t.type === 'income' ? 'income' : 'expense',
      }));
    } catch (_) {
      return [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
    } catch (_) {}
  }

  function addTransaction(tx) {
    transactions.push(tx);
    saveTransactions();
  }

  function updateTransaction(id, updates) {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    transactions[idx] = { ...transactions[idx], ...updates };
    saveTransactions();
    return true;
  }

  function deleteTransaction(id) {
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
  }

  function getFilters() {
    const month = filterMonth && filterMonth.value ? filterMonth.value : '';
    const search = filterSearch && filterSearch.value ? filterSearch.value.trim().toLowerCase() : '';
    return { month, search };
  }

  function applyFilters(list) {
    const { month, search } = getFilters();
    return list.filter((t) => {
      const mOk = month ? getMonthKey(t.date) === month : true;
      const sOk = search ? (
        t.description.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      ) : true;
      return mOk && sOk;
    });
  }

  function renderTable() {
    clearTable();
    const list = applyFilters(transactions).sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();
    for (const t of list) {
      const tr = document.createElement('tr');
      const tdDate = document.createElement('td');
      const tdDesc = document.createElement('td');
      const tdCat = document.createElement('td');
      const tdAmt = document.createElement('td');
      const tdType = document.createElement('td');
      const tdActions = document.createElement('td');

      tdDate.textContent = t.date;
      tdDesc.textContent = t.description;
      tdCat.textContent = t.category;
      tdAmt.textContent = formatCurrency(t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount));
      tdAmt.className = 'right ' + (t.type === 'income' ? 'amount-income' : 'amount-expense');
      tdType.textContent = t.type;

      tdActions.innerHTML = '<div class="row-actions">\
        <button data-action="edit" data-id="' + t.id + '" class="small secondary">Edit</button>\
        <button data-action="delete" data-id="' + t.id + '" class="small danger">Delete</button>\
      </div>';

      tr.appendChild(tdDate);
      tr.appendChild(tdDesc);
      tr.appendChild(tdCat);
      tr.appendChild(tdAmt);
      tr.appendChild(tdType);
      tr.appendChild(tdActions);
      fragment.appendChild(tr);
    }
    tableBody.appendChild(fragment);
  }

  function renderSummaries() {
    const list = applyFilters(transactions);
    let income = 0;
    let expenses = 0;
    for (const t of list) {
      if (t.type === 'income') income += Math.abs(t.amount);
      else expenses += Math.abs(t.amount);
    }
    const balance = income - expenses;
    if (summaryIncome) summaryIncome.textContent = formatCurrency(income);
    if (summaryExpenses) summaryExpenses.textContent = formatCurrency(expenses);
    if (summaryBalance) summaryBalance.textContent = formatCurrency(balance);
  }

  function updateCharts() {
    const list = applyFilters(transactions).sort((a, b) => a.date.localeCompare(b.date));
    upsertCategoryChart(list);
    upsertBalanceChart(list);
  }

  function upsertCategoryChart(list) {
    const canvas = document.getElementById('chart-category');
    if (!canvas || !window.Chart) return;
    const sumsByCategory = {};
    for (const t of list) {
      const sign = t.type === 'income' ? 1 : -1;
      sumsByCategory[t.category] = (sumsByCategory[t.category] || 0) + sign * Math.abs(t.amount);
    }
    const labels = Object.keys(sumsByCategory);
    const data = labels.map((k) => sumsByCategory[k]);
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Net by Category',
          data,
          backgroundColor: labels.map((_, i) => `hsl(${(i * 57) % 360} 70% 55%)`),
          borderWidth: 0,
        }],
      },
      options: {
        plugins: {
          legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}` } }
        }
      }
    });
  }

  function upsertBalanceChart(list) {
    const canvas = document.getElementById('chart-balance');
    if (!canvas || !window.Chart) return;
    const map = new Map();
    for (const t of list) {
      const amt = t.type === 'income' ? Math.abs(t.amount) : -Math.abs(t.amount);
      map.set(t.date, (map.get(t.date) || 0) + amt);
    }
    const dates = Array.from(map.keys()).sort();
    let running = 0;
    const balances = dates.map((d) => { running += map.get(d); return running; });
    if (balanceChart) balanceChart.destroy();
    balanceChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Balance',
          data: balances,
          borderColor: getComputedStyle(document.body).getPropertyValue('--primary'),
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.2,
        }],
      },
      options: {
        scales: {
          x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') } },
          y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted'), callback: (v) => formatCurrency(v) } },
        },
        plugins: {
          legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } }
        }
      }
    });
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    setTodayOnDateInput();
    editingId = null;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add';
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const date = normalizeDate(dateInput.value);
    const description = String(inputDesc.value || '').trim();
    const category = String(inputCategory.value || '').trim();
    const amount = Math.abs(parseAmount(inputAmount.value));
    const type = inputType.value === 'income' ? 'income' : 'expense';
    if (!description || !category || !amount) {
      alert('Please fill all fields with valid values.');
      return;
    }
    if (editingId) {
      updateTransaction(editingId, { date, description, category, amount, type });
    } else {
      addTransaction({ id: generateId(), date, description, category, amount, type });
    }
    renderTable();
    renderSummaries();
    updateCharts();
    resetForm();
  }

  function handleRowActionClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    if (!action || !id) return;
    if (action === 'edit') {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      dateInput.value = tx.date;
      inputDesc.value = tx.description;
      inputCategory.value = tx.category;
      inputAmount.value = String(tx.amount);
      inputType.value = tx.type;
      editingId = tx.id;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Save';
      dateInput.focus();
    } else if (action === 'delete') {
      deleteTransaction(id);
      renderTable();
      renderSummaries();
      updateCharts();
    }
  }

  function handleExport() {
    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-tracker-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'));
        if (!Array.isArray(parsed)) throw new Error('Invalid file');
        transactions = parsed.map((t) => ({
          id: String(t.id || generateId()),
          date: normalizeDate(t.date),
          description: String(t.description || ''),
          category: String(t.category || ''),
          amount: Number(t.amount) || 0,
          type: t.type === 'income' ? 'income' : 'expense',
        }));
        saveTransactions();
        renderTable();
        renderSummaries();
        updateCharts();
      } catch (_) {
        alert('Failed to import file. Make sure it is a valid JSON export.');
      } finally {
        evt.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleLoadSample() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const baseMonth = `${yyyy}-${mm}`;
    const sample = [
      { date: `${baseMonth}-01`, description: 'Salary', category: 'Income', amount: 3200, type: 'income' },
      { date: `${baseMonth}-02`, description: 'Rent', category: 'Housing', amount: 1200, type: 'expense' },
      { date: `${baseMonth}-03`, description: 'Groceries', category: 'Food', amount: 140, type: 'expense' },
      { date: `${baseMonth}-05`, description: 'Stock Dividend', category: 'Investments', amount: 45, type: 'income' },
      { date: `${baseMonth}-07`, description: 'Coffee', category: 'Food', amount: 9.5, type: 'expense' },
      { date: `${baseMonth}-10`, description: 'Gas', category: 'Transport', amount: 65, type: 'expense' },
      { date: `${baseMonth}-12`, description: 'Freelance', category: 'Income', amount: 400, type: 'income' },
      { date: `${baseMonth}-15`, description: 'Internet', category: 'Utilities', amount: 60, type: 'expense' },
      { date: `${baseMonth}-18`, description: 'Restaurant', category: 'Food', amount: 55, type: 'expense' },
      { date: `${baseMonth}-20`, description: 'Electricity', category: 'Utilities', amount: 80, type: 'expense' },
    ].map((t) => ({ ...t, id: generateId() }));
    transactions = sample;
    saveTransactions();
    renderTable();
    renderSummaries();
    updateCharts();
  }

  function wireEvents() {
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
    if (importInput) importInput.addEventListener('change', handleImport);
    if (loadBtn) loadBtn.addEventListener('click', handleLoadSample);
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
      form.addEventListener('reset', () => setTimeout(resetForm, 0));
    }
    if (filterMonth) filterMonth.addEventListener('change', () => { renderTable(); renderSummaries(); updateCharts(); });
    if (filterSearch) filterSearch.addEventListener('input', () => { renderTable(); renderSummaries(); updateCharts(); });
    if (tableBody) tableBody.addEventListener('click', handleRowActionClick);
  }

  function init() {
    initTheme();
    setTodayOnDateInput();
    transactions = loadTransactions();
    renderTable();
    renderSummaries();
    updateCharts();
    wireEvents();
  }

  themeToggleButton.addEventListener('click', toggleTheme);
  document.addEventListener('DOMContentLoaded', init);
})();

