import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div id="latte-root">
      <LatteApp />
    </div>
  );
}

function LatteApp() {
  useEffect(() => {
    initApp();
  }, []);
  return <div id="app-shell"></div>;
}

// ─────────────────────────────────────────────
// STORAGE MODULE
// ─────────────────────────────────────────────
const STORAGE_KEY = 'latte_data';

function getDefaultData() {
  return {
    accounts: [],
    transactions: [],
    budgets: [],
    settings: { theme: 'light', privacy: false, language: 'id' }
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return getDefaultData();
  }
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getData() { return loadData(); }

function getAccounts() { return getData().accounts; }
function getTransactions() { return getData().transactions; }
function getBudgets() { return getData().budgets; }
function getSettings() { return getData().settings; }

function saveAccounts(accounts: any[]) {
  const d = getData(); d.accounts = accounts; saveData(d);
}
function saveTransactions(transactions: any[]) {
  const d = getData(); d.transactions = transactions; saveData(d);
}
function saveBudgets(budgets: any[]) {
  const d = getData(); d.budgets = budgets; saveData(d);
}
function saveSettings(settings: any) {
  const d = getData(); d.settings = { ...d.settings, ...settings }; saveData(d);
}

function addAccount(account: any) {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
}
function updateAccount(id: string, updates: any) {
  const accounts = getAccounts().map((a: any) => a.id === id ? { ...a, ...updates } : a);
  saveAccounts(accounts);
}
function deleteAccount(id: string) {
  saveAccounts(getAccounts().filter((a: any) => a.id !== id));
}
function addTransaction(tx: any) {
  const txs = getTransactions();
  txs.push(tx);
  saveTransactions(txs);
}
function deleteTransaction(id: string) {
  saveTransactions(getTransactions().filter((t: any) => t.id !== id));
}
function upsertBudget(budget: any) {
  const budgets = getBudgets();
  const idx = budgets.findIndex((b: any) => b.category === budget.category);
  if (idx >= 0) budgets[idx] = budget;
  else budgets.push(budget);
  saveBudgets(budgets);
}
function deleteBudget(category: string) {
  saveBudgets(getBudgets().filter((b: any) => b.category !== category));
}

// ─────────────────────────────────────────────
// FINANCE MODULE
// ─────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseAmount(raw: string): number {
  if (!raw) return NaN;
  let s = raw.trim().toLowerCase().replace(/\s/g, '');
  s = s.replace(',', '.');
  const jt = s.match(/^([\d.]+)jt$/);
  if (jt) return parseFloat(jt[1]) * 1_000_000;
  const k = s.match(/^([\d.]+)k$/);
  if (k) return parseFloat(k[1]) * 1_000;
  s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

function formatIDR(amount: number, privacy = false): string {
  if (privacy) return 'Rp ••••••';
  return 'Rp ' + Math.abs(amount).toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

function getTotalBalance(privacy = false): string {
  const total = getAccounts().reduce((s: number, a: any) => s + (a.balance || 0), 0);
  return formatIDR(total, privacy);
}

function _getTotalBalanceRaw(): number {
  return getAccounts().reduce((s: number, a: any) => s + (a.balance || 0), 0);
}
void _getTotalBalanceRaw;

function filterTransactions(period: string): any[] {
  const txs = getTransactions();
  const now = new Date();
  return txs.filter((t: any) => {
    const d = new Date(t.date);
    if (period === 'daily') {
      return d.toDateString() === now.toDateString();
    } else if (period === 'weekly') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    } else if (period === 'monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function getTotalIncome(period = 'monthly'): number {
  return filterTransactions(period)
    .filter((t: any) => t.type === 'income')
    .reduce((s: number, t: any) => s + t.amount, 0);
}

function getTotalExpense(period = 'monthly'): number {
  return filterTransactions(period)
    .filter((t: any) => t.type === 'expense')
    .reduce((s: number, t: any) => s + t.amount, 0);
}

function getBudgetStatus(): any[] {
  const budgets = getBudgets();
  const now = new Date();
  const monthlyTxs = getTransactions().filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return budgets.map((b: any) => {
    const spent = monthlyTxs
      .filter((t: any) => t.type === 'expense' && t.category === b.category)
      .reduce((s: number, t: any) => s + t.amount, 0);
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    return { ...b, spent, pct, remaining: b.limit - spent };
  });
}

function processTransaction(tx: any): { ok: boolean; error?: string } {
  const accounts = getAccounts();
  if (tx.type === 'income') {
    const acc = accounts.find((a: any) => a.id === tx.toAccountId);
    if (!acc) return { ok: false, error: 'Akun tujuan tidak ditemukan.' };
    updateAccount(acc.id, { balance: acc.balance + tx.amount });
  } else if (tx.type === 'expense') {
    const acc = accounts.find((a: any) => a.id === tx.fromAccountId);
    if (!acc) return { ok: false, error: 'Akun sumber tidak ditemukan.' };
    updateAccount(acc.id, { balance: acc.balance - tx.amount });
  } else if (tx.type === 'transfer') {
    const from = accounts.find((a: any) => a.id === tx.fromAccountId);
    const to = accounts.find((a: any) => a.id === tx.toAccountId);
    if (!from || !to) return { ok: false, error: 'Akun tidak ditemukan.' };
    const fee = tx.fee || 0;
    updateAccount(from.id, { balance: from.balance - tx.amount - fee });
    updateAccount(to.id, { balance: to.balance + tx.amount });
  }
  addTransaction(tx);
  return { ok: true };
}

function reverseTransaction(tx: any) {
  const accounts = getAccounts();
  if (tx.type === 'income') {
    const acc = accounts.find((a: any) => a.id === tx.toAccountId);
    if (acc) updateAccount(acc.id, { balance: acc.balance - tx.amount });
  } else if (tx.type === 'expense') {
    const acc = accounts.find((a: any) => a.id === tx.fromAccountId);
    if (acc) updateAccount(acc.id, { balance: acc.balance + tx.amount });
  } else if (tx.type === 'transfer') {
    const from = accounts.find((a: any) => a.id === tx.fromAccountId);
    const to = accounts.find((a: any) => a.id === tx.toAccountId);
    const fee = tx.fee || 0;
    if (from) updateAccount(from.id, { balance: from.balance + tx.amount + fee });
    if (to) updateAccount(to.id, { balance: to.balance - tx.amount });
  }
  deleteTransaction(tx.id);
}

// ─────────────────────────────────────────────
// ANALYSIS MODULE
// ─────────────────────────────────────────────
interface Insight {
  type: 'warning' | 'alert' | 'info' | 'success';
  title: string;
  message: string;
  priority: number;
}

function runAnalysis(): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const txs = getTransactions();
  const accounts = getAccounts();

  const monthlyTxs = txs.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = monthlyTxs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthlyTxs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const totalBalance = accounts.reduce((s: number, a: any) => s + a.balance, 0);
  const budgetStatuses = getBudgetStatus();

  // 1. Budget ≥ 80% → warning
  budgetStatuses.forEach((b: any) => {
    if (b.pct >= 80 && b.pct < 100) {
      insights.push({
        type: 'warning', priority: 9,
        title: `⚠️ Budget ${b.category} hampir habis`,
        message: `Kamu sudah pakai ${b.pct.toFixed(0)}% dari budget ${b.category}. Sisa ${formatIDR(b.remaining)} — hati-hati ya!`
      });
    }
  });

  // 2. Budget exceeded → alert
  budgetStatuses.forEach((b: any) => {
    if (b.pct >= 100) {
      insights.push({
        type: 'alert', priority: 10,
        title: `🚨 Budget ${b.category} terlampaui!`,
        message: `Pengeluaran ${b.category} melebihi batas ${formatIDR(b.limit)}. Udah jebol ${formatIDR(b.spent - b.limit)} nih.`
      });
    }
  });

  // 3. Early overspending (before day 10)
  if (now.getDate() < 10 && expense > income * 0.5 && income > 0) {
    insights.push({
      type: 'warning', priority: 8,
      title: '📅 Boros di awal bulan',
      message: `Baru tanggal ${now.getDate()}, tapi sudah habis ${formatIDR(expense)}. Jaga pengeluaran biar bulan ini aman!`
    });
  }

  // 4. Daily spike (2x average)
  const todayTxs = monthlyTxs.filter((t: any) => {
    const d = new Date(t.date);
    return d.toDateString() === now.toDateString() && t.type === 'expense';
  });
  const todayExpense = todayTxs.reduce((s: number, t: any) => s + t.amount, 0);
  const daysPassed = Math.max(now.getDate(), 1);
  const dailyAvg = expense / daysPassed;
  if (todayExpense > dailyAvg * 2 && dailyAvg > 0) {
    insights.push({
      type: 'warning', priority: 7,
      title: '📈 Pengeluaran hari ini melonjak',
      message: `Hari ini habis ${formatIDR(todayExpense)}, 2x lebih dari rata-rata harianmu ${formatIDR(dailyAvg)}. Ada apa?`
    });
  }

  // 5. Many small transactions (>10 per day)
  const smallTxs = monthlyTxs.filter((t: any) => t.type === 'expense' && t.amount < 20000);
  if (smallTxs.length >= 10) {
    insights.push({
      type: 'info', priority: 5,
      title: '☕ Banyak transaksi kecil',
      message: `Ada ${smallTxs.length} transaksi kecil bulan ini. Kalau dijumlah, ${formatIDR(smallTxs.reduce((s: number, t: any) => s + t.amount, 0))} — lumayan!`
    });
  }

  // 6. Large transaction (>30% balance)
  const largeTxs = monthlyTxs.filter((t: any) => t.type === 'expense' && totalBalance > 0 && t.amount > totalBalance * 0.3);
  if (largeTxs.length > 0) {
    const largest = largeTxs.sort((a: any, b: any) => b.amount - a.amount)[0];
    insights.push({
      type: 'warning', priority: 7,
      title: '💸 Transaksi besar terdeteksi',
      message: `Transaksi ${largest.category} sebesar ${formatIDR(largest.amount)} melebihi 30% total saldo kamu.`
    });
  }

  // 7. No income recorded
  if (income === 0 && monthlyTxs.length > 0) {
    insights.push({
      type: 'alert', priority: 8,
      title: '❌ Belum ada pemasukan',
      message: `Bulan ini belum ada pemasukan tercatat. Sudah masuk gaji? Jangan lupa catat ya!`
    });
  }

  // 8. Expense > income
  if (income > 0 && expense > income) {
    insights.push({
      type: 'alert', priority: 9,
      title: '🔴 Pengeluaran > Pemasukan',
      message: `Kamu sudah defisit ${formatIDR(expense - income)} bulan ini. Saatnya rem pengeluaran!`
    });
  }

  // 9. Saving rate < 10%
  if (income > 0) {
    const savingRate = ((income - expense) / income) * 100;
    if (savingRate < 10 && savingRate >= 0) {
      insights.push({
        type: 'warning', priority: 6,
        title: '🐷 Saving rate rendah',
        message: `Saving rate bulan ini hanya ${savingRate.toFixed(1)}%. Target idealnya minimal 20%. Yuk tabung lebih!`
      });
    }
  }

  // 10. Dominant category (>40% of expense)
  if (expense > 0) {
    const catMap: Record<string, number> = {};
    monthlyTxs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    Object.entries(catMap).forEach(([cat, val]) => {
      const pct = (val / expense) * 100;
      if (pct > 40) {
        insights.push({
          type: 'info', priority: 4,
          title: `🎯 ${cat} dominasi pengeluaran`,
          message: `${pct.toFixed(0)}% pengeluaranmu adalah ${cat}. Pertimbangkan untuk diversifikasi atau kurangi sedikit.`
        });
      }
    });
  }

  // 11. Unused budget categories
  const budgetCats = getBudgets().map((b: any) => b.category);
  const usedCats = new Set(monthlyTxs.filter((t: any) => t.type === 'expense').map((t: any) => t.category));
  const unusedCats = budgetCats.filter((c: string) => !usedCats.has(c));
  if (unusedCats.length > 0) {
    insights.push({
      type: 'info', priority: 2,
      title: `✅ Budget ${unusedCats[0]} masih utuh`,
      message: `Kamu belum ada pengeluaran di kategori ${unusedCats.join(', ')}. Bagus — pertahankan!`
    });
  }

  // 12. No transactions for 3 days
  const recentDates = txs.map((t: any) => new Date(t.date).getTime()).sort((a: number, b: number) => b - a);
  if (recentDates.length > 0) {
    const daysSinceLastTx = (now.getTime() - recentDates[0]) / (1000 * 60 * 60 * 24);
    if (daysSinceLastTx >= 3) {
      insights.push({
        type: 'info', priority: 3,
        title: '📭 Belum ada transaksi 3 hari',
        message: `Sudah ${Math.floor(daysSinceLastTx)} hari tidak ada transaksi. Jangan lupa catat pengeluaran hari ini ya!`
      });
    }
  }

  // 13. Weekly activity spike
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
  const thisWeekExp = txs.filter((t: any) => new Date(t.date) >= weekAgo && t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const lastWeekExp = txs.filter((t: any) => new Date(t.date) >= twoWeeksAgo && new Date(t.date) < weekAgo && t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  if (lastWeekExp > 0 && thisWeekExp > lastWeekExp * 1.5) {
    insights.push({
      type: 'warning', priority: 6,
      title: '📊 Lonjakan aktivitas mingguan',
      message: `Pengeluaran minggu ini ${formatIDR(thisWeekExp)}, naik ${((thisWeekExp / lastWeekExp - 1) * 100).toFixed(0)}% dari minggu lalu!`
    });
  }

  // 14. Frequent transfers
  const transfers = monthlyTxs.filter((t: any) => t.type === 'transfer');
  if (transfers.length >= 5) {
    insights.push({
      type: 'info', priority: 3,
      title: '🔄 Banyak transfer bulan ini',
      message: `Ada ${transfers.length} transfer antar akun. Pastikan saldo antar akun tetap seimbang ya!`
    });
  }

  // 15. High fee (>5% of transfer amount)
  const highFeeTxs = monthlyTxs.filter((t: any) => t.type === 'transfer' && t.fee && t.amount > 0 && (t.fee / t.amount) > 0.05);
  if (highFeeTxs.length > 0) {
    insights.push({
      type: 'warning', priority: 5,
      title: '💳 Biaya transfer tinggi',
      message: `Ada ${highFeeTxs.length} transfer dengan biaya admin >5%. Coba cari alternatif transfer gratis!`
    });
  }

  // Sort by priority descending, return top 3
  insights.sort((a, b) => b.priority - a.priority);
  return insights.slice(0, 3);
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
const CATEGORIES = {
  expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Tagihan', 'Investasi', 'Lainnya'],
  income: ['Gaji', 'Freelance', 'Bisnis', 'Investasi', 'Hadiah', 'Lainnya'],
  transfer: ['Transfer']
};

// ─────────────────────────────────────────────
// UI MODULE
// ─────────────────────────────────────────────
let currentPeriod = 'monthly';
let currentPage = 'dashboard';
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const existing = document.getElementById('latte-toast');
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.id = 'latte-toast';
  toast.className = `latte-toast latte-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('latte-toast--show'));
  toastTimer = setTimeout(() => {
    toast.classList.remove('latte-toast--show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
}

function renderApp() {
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  
  shell.innerHTML = `
    <div class="latte-container">
      <!-- SIDEBAR (Cuma muncul di Desktop) -->
      <aside class="latte-sidebar-desktop">
        <div class="latte-sidebar__brand">☕ Latte</div>
        <nav class="latte-sidebar__nav">
          <button class="sidebar-item active" data-page="dashboard">🏠 Dashboard</button>
          <button class="sidebar-item" data-page="transactions">📜 Transaksi</button>
          <button class="sidebar-item" data-page="budget">🎯 Budget</button>
          <button class="sidebar-item" data-page="accounts">💳 Akun</button>
        </nav>
        <div class="sidebar-footer">
          <button id="sidebar-theme-toggle">🌙 Dark Mode</button>
        </div>
      </aside>

      <!-- CONTENT AREA -->
      <div class="latte-content-wrapper">
        ${renderHeader()} <!-- Header HP tetep ada tapi nanti kita sesuaikan -->
        <main class="latte-main">
          ${renderPage()}
        </main>
        ${renderNav()} <!-- Navigasi Bawah (Cuma di HP) -->
      </div>
    </div>
  `;
  attachEventListeners();
}

function renderHeader() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const theme = settings.theme;
  return `
    <header class="latte-header">
      <div class="latte-header__left">
        <span class="latte-logo">☕ Latte</span>
      </div>
      <div class="latte-header__right">
        <button class="latte-icon-btn" id="btn-privacy" title="Privacy Mode" aria-label="Toggle Privacy">
          ${privacy ? '👁️' : '🙈'}
        </button>
        <button class="latte-icon-btn" id="btn-theme" title="Toggle Theme" aria-label="Toggle Theme">
          ${theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  `;
}

function renderNav() {
  const pages = [
    { id: 'dashboard', icon: '🏠', label: 'Beranda' },
    { id: 'transactions', icon: '📋', label: 'Transaksi' },
    { id: 'budget', icon: '🎯', label: 'Budget' },
    { id: 'accounts', icon: '🏦', label: 'Akun' },
    { id: 'insights', icon: '💡', label: 'Insights' }
  ];
  return `
    <nav class="latte-nav">
      ${pages.map(p => `
        <button class="latte-nav__item ${currentPage === p.id ? 'latte-nav__item--active' : ''}" data-page="${p.id}">
          <span class="latte-nav__icon">${p.icon}</span>
          <span class="latte-nav__label">${p.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function renderFAB() {
  return `<button class="latte-fab" id="btn-fab" aria-label="Tambah Transaksi">＋</button>`;
}

function renderPage() {
  switch (currentPage) {
    case 'dashboard': return renderDashboard();
    case 'transactions': return renderTransactions();
    case 'budget': return renderBudget();
    case 'accounts': return renderAccounts();
    case 'insights': return renderInsights();
    default: return renderDashboard();
  }
}

function renderPeriodFilter() {
  const periods = [
    { id: 'daily', label: 'Hari Ini' },
    { id: 'weekly', label: 'Minggu Ini' },
    { id: 'monthly', label: 'Bulan Ini' }
  ];
  return `
    <div class="latte-period-filter">
      ${periods.map(p => `
        <button class="latte-period-btn ${currentPeriod === p.id ? 'latte-period-btn--active' : ''}" data-period="${p.id}">
          ${p.label}
        </button>
      `).join('')}
    </div>
  `;
}

function renderDashboard() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const income = getTotalIncome(currentPeriod);
  const expense = getTotalExpense(currentPeriod);
  const txs = filterTransactions(currentPeriod);
  const recentTxs = [...getTransactions()].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return `
    <div class="latte-page">
      ${renderPeriodFilter()}

      <!-- Grid Wrapper: Ini kuncinya biar nggak kayak emulator -->
      <div class="latte-dashboard-grid">
        
        <!-- Kolom Kiri: Fokus Saldo & List Transaksi -->
        <div class="latte-dashboard-main">
          <div class="latte-balance-card">
            <div class="latte-balance-card__label">Total Saldo</div>
            <div class="latte-balance-card__amount">${getTotalBalance(privacy)}</div>
            <div class="latte-balance-card__sub">
              <span>${getAccounts().length} akun aktif</span>
            </div>
          </div>

          <div class="latte-section">
            <div class="latte-section__header">
              <h3 class="latte-section__title">Transaksi Terakhir</h3>
              <button class="latte-link" data-page="transactions">Lihat semua</button>
            </div>
            ${recentTxs.length === 0
              ? `<div class="latte-empty"><span class="latte-empty__icon">📭</span><p>Belum ada transaksi</p></div>`
              : recentTxs.map((t: any) => renderTransactionItem(t, privacy)).join('')
            }
          </div>
        </div>

        <!-- Kolom Kanan: Fokus Pemasukan/Pengeluaran & Budget -->
        <div class="latte-dashboard-sidebar">
          <div class="latte-stats-row">
            <div class="latte-stat-card latte-stat-card--income">
              <div class="latte-stat-card__icon">📈</div>
              <div class="latte-stat-card__label">Pemasukan</div>
              <div class="latte-stat-card__value">${formatIDR(income, privacy)}</div>
            </div>
            <div class="latte-stat-card latte-stat-card--expense">
              <div class="latte-stat-card__icon">📉</div>
              <div class="latte-stat-card__label">Pengeluaran</div>
              <div class="latte-stat-card__value">${formatIDR(expense, privacy)}</div>
            </div>
          </div>
          
          ${renderBudgetSummaryCards(privacy)}
        </div>

      </div>
    </div>
  `;
}

function renderBudgetSummaryCards(privacy: boolean) {
  const budgets = getBudgetStatus();
  if (budgets.length === 0) return '';
  return `
    <div class="latte-section">
      <div class="latte-section__header">
        <h3 class="latte-section__title">Budget Bulan Ini</h3>
        <button class="latte-link" data-page="budget">Kelola</button>
      </div>
      ${budgets.slice(0, 3).map((b: any) => `
        <div class="latte-budget-mini">
          <div class="latte-budget-mini__top">
            <span class="latte-budget-mini__cat">${b.category}</span>
            <span class="latte-budget-mini__pct ${b.pct >= 100 ? 'text-danger' : b.pct >= 80 ? 'text-warning' : ''}">${b.pct.toFixed(0)}%</span>
          </div>
          <div class="latte-progress">
            <div class="latte-progress__bar ${b.pct >= 100 ? 'latte-progress__bar--danger' : b.pct >= 80 ? 'latte-progress__bar--warning' : ''}" style="width:${Math.min(b.pct, 100)}%"></div>
          </div>
          <div class="latte-budget-mini__amounts">
            <span>${formatIDR(b.spent, privacy)}</span>
            <span class="latte-muted">dari ${formatIDR(b.limit, privacy)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOnboarding() {
  return `
    <div class="latte-onboarding">
      <div class="latte-onboarding__icon">☕</div>
      <h2 class="latte-onboarding__title">Selamat datang di Latte!</h2>
      <p class="latte-onboarding__sub">Mulai dengan menambahkan akun keuanganmu, lalu catat transaksi pertamamu.</p>
      <button class="latte-btn latte-btn--primary" id="btn-add-account-onboard">+ Tambah Akun Pertama</button>
    </div>
  `;
}

function renderTransactions() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const txs = [...filterTransactions(currentPeriod)].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return `
    <div class="latte-page">
      <div class="latte-page__header">
        <h2 class="latte-page__title">Transaksi</h2>
      </div>
      ${renderPeriodFilter()}
      ${txs.length === 0
        ? `<div class="latte-empty"><span class="latte-empty__icon">📋</span><p>Tidak ada transaksi</p><p class="latte-empty__sub">Tap tombol + untuk tambah transaksi baru</p></div>`
        : `<div class="latte-tx-list">${txs.map((t: any) => renderTransactionItem(t, privacy)).join('')}</div>`
      }
    </div>
  `;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Makanan': '🍜', 'Transportasi': '🚗', 'Belanja': '🛍️', 'Hiburan': '🎮',
    'Kesehatan': '💊', 'Pendidikan': '📚', 'Tagihan': '📄', 'Investasi': '📈',
    'Gaji': '💼', 'Freelance': '💻', 'Bisnis': '🏪', 'Hadiah': '🎁',
    'Transfer': '🔄', 'Lainnya': '📦'
  };
  return icons[category] || '💰';
}

function renderTransactionItem(t: any, privacy: boolean) {
  const accounts = getAccounts();
  const fromAcc = accounts.find((a: any) => a.id === t.fromAccountId);
  const toAcc = accounts.find((a: any) => a.id === t.toAccountId);
  const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';
  const amtClass = t.type === 'income' ? 'latte-tx__amount--income' : t.type === 'expense' ? 'latte-tx__amount--expense' : 'latte-tx__amount--transfer';

  let subtitle = dateStr;
  if (t.type === 'transfer') {
    subtitle = `${fromAcc?.name || '?'} → ${toAcc?.name || '?'}${t.fee ? ' (fee: ' + formatIDR(t.fee) + ')' : ''} · ${dateStr}`;
  } else if (t.type === 'income' && toAcc) {
    subtitle = `${toAcc.name} · ${dateStr}`;
  } else if (t.type === 'expense' && fromAcc) {
    subtitle = `${fromAcc.name} · ${dateStr}`;
  }

  return `
    <div class="latte-tx-item" data-tx-id="${t.id}">
      <div class="latte-tx__icon">${getCategoryIcon(t.category)}</div>
      <div class="latte-tx__info">
        <div class="latte-tx__category">${t.category}</div>
        <div class="latte-tx__sub">${subtitle}</div>
      </div>
      <div class="latte-tx__right">
        <div class="latte-tx__amount ${amtClass}">${sign}${formatIDR(t.amount, privacy)}</div>
        <button class="latte-tx__delete" data-tx-id="${t.id}" title="Hapus">🗑️</button>
      </div>
    </div>
  `;
}

function renderBudget() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const budgets = getBudgetStatus();

  return `
    <div class="latte-page">
      <div class="latte-page__header">
        <h2 class="latte-page__title">Budget</h2>
        <button class="latte-btn latte-btn--sm latte-btn--primary" id="btn-add-budget">+ Budget</button>
      </div>
      ${budgets.length === 0
        ? `<div class="latte-empty"><span class="latte-empty__icon">🎯</span><p>Belum ada budget</p><p class="latte-empty__sub">Atur budget kategori untuk kontrol pengeluaran</p></div>`
        : budgets.map((b: any) => `
          <div class="latte-budget-card ${b.pct >= 100 ? 'latte-budget-card--danger' : b.pct >= 80 ? 'latte-budget-card--warning' : ''}">
            <div class="latte-budget-card__header">
              <div class="latte-budget-card__title">
                <span class="latte-budget-card__icon">${getCategoryIcon(b.category)}</span>
                <span>${b.category}</span>
              </div>
              <div class="latte-budget-card__actions">
                ${b.pct >= 100 ? '<span class="latte-badge latte-badge--danger">Terlampaui!</span>' : b.pct >= 80 ? '<span class="latte-badge latte-badge--warning">Hampir habis</span>' : ''}
                <button class="latte-icon-btn latte-budget__delete" data-budget-cat="${b.category}" title="Hapus budget">✕</button>
              </div>
            </div>
            <div class="latte-progress">
              <div class="latte-progress__bar ${b.pct >= 100 ? 'latte-progress__bar--danger' : b.pct >= 80 ? 'latte-progress__bar--warning' : ''}" style="width:${Math.min(b.pct, 100)}%"></div>
            </div>
            <div class="latte-budget-card__stats">
              <div>
                <div class="latte-budget-card__stat-label">Dipakai</div>
                <div class="latte-budget-card__stat-value">${formatIDR(b.spent, privacy)}</div>
              </div>
              <div>
                <div class="latte-budget-card__stat-label">Limit</div>
                <div class="latte-budget-card__stat-value">${formatIDR(b.limit, privacy)}</div>
              </div>
              <div>
                <div class="latte-budget-card__stat-label">Sisa</div>
                <div class="latte-budget-card__stat-value ${b.remaining < 0 ? 'text-danger' : ''}">${formatIDR(Math.abs(b.remaining), privacy)}${b.remaining < 0 ? ' (minus)' : ''}</div>
              </div>
            </div>
          </div>
        `).join('')
      }
    </div>
  `;
}

function renderAccounts() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const accounts = getAccounts();

  return `
    <div class="latte-page">
      <div class="latte-page__header">
        <h2 class="latte-page__title">Akun</h2>
        <button class="latte-btn latte-btn--sm latte-btn--primary" id="btn-add-account">+ Akun</button>
      </div>
      ${accounts.length === 0
        ? `<div class="latte-empty"><span class="latte-empty__icon">🏦</span><p>Belum ada akun</p><p class="latte-empty__sub">Tambah akun tabungan, dompet, atau kartu kredit</p></div>`
        : accounts.map((a: any) => `
          <div class="latte-account-card">
            <div class="latte-account-card__icon">🏦</div>
            <div class="latte-account-card__info">
              <div class="latte-account-card__name">${a.name}</div>
              <div class="latte-account-card__balance">${formatIDR(a.balance, privacy)}</div>
            </div>
            <button class="latte-icon-btn latte-account__delete" data-account-id="${a.id}" title="Hapus akun">🗑️</button>
          </div>
        `).join('')
      }
      <div class="latte-accounts-total">
        <span class="latte-muted">Total saldo semua akun</span>
        <strong>${formatIDR(accounts.reduce((s: number, a: any) => s + a.balance, 0), privacy)}</strong>
      </div>
    </div>
  `;
}

function renderInsights() {
  const insights = runAnalysis();
  const txs = getTransactions();

  return `
    <div class="latte-page">
      <div class="latte-page__header">
        <h2 class="latte-page__title">Insights</h2>
      </div>
      ${txs.length === 0
        ? `<div class="latte-empty"><span class="latte-empty__icon">💡</span><p>Belum ada data untuk dianalisis</p><p class="latte-empty__sub">Tambah beberapa transaksi untuk mendapat insights</p></div>`
        : insights.length === 0
          ? `<div class="latte-insight-card latte-insight-card--success"><div class="latte-insight__icon">✅</div><div><div class="latte-insight__title">Keuangan kamu sehat!</div><div class="latte-insight__msg">Tidak ada masalah yang terdeteksi. Pertahankan kebiasaan baikmu!</div></div></div>`
          : insights.map((ins: Insight) => `
            <div class="latte-insight-card latte-insight-card--${ins.type}">
              <div class="latte-insight__content">
                <div class="latte-insight__title">${ins.title}</div>
                <div class="latte-insight__msg">${ins.message}</div>
              </div>
            </div>
          `).join('')
      }
      ${renderFinanceSummary()}
    </div>
  `;
}

function renderFinanceSummary() {
  const settings = getSettings();
  const privacy = settings.privacy;
  const income = getTotalIncome('monthly');
  const expense = getTotalExpense('monthly');
  const saving = income - expense;
  const savingRate = income > 0 ? ((saving / income) * 100).toFixed(1) : '0';

  return `
    <div class="latte-finance-summary">
      <h3 class="latte-section__title">Ringkasan Bulan Ini</h3>
      <div class="latte-summary-grid">
        <div class="latte-summary-item">
          <div class="latte-summary-item__label">Pemasukan</div>
          <div class="latte-summary-item__value text-income">${formatIDR(income, privacy)}</div>
        </div>
        <div class="latte-summary-item">
          <div class="latte-summary-item__label">Pengeluaran</div>
          <div class="latte-summary-item__value text-expense">${formatIDR(expense, privacy)}</div>
        </div>
        <div class="latte-summary-item">
          <div class="latte-summary-item__label">Tabungan</div>
          <div class="latte-summary-item__value ${saving >= 0 ? 'text-income' : 'text-danger'}">${saving >= 0 ? '+' : '-'}${formatIDR(Math.abs(saving), privacy)}</div>
        </div>
        <div class="latte-summary-item">
          <div class="latte-summary-item__label">Saving Rate</div>
          <div class="latte-summary-item__value ${parseFloat(savingRate) >= 20 ? 'text-income' : parseFloat(savingRate) >= 10 ? 'text-warning' : 'text-danger'}">${savingRate}%</div>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
function renderTransactionModal() {
  const accounts = getAccounts();
  return `
    <div class="latte-modal-overlay" id="modal-transaction" aria-hidden="true">
      <div class="latte-modal">
        <div class="latte-modal__header">
          <h3 class="latte-modal__title">Tambah Transaksi</h3>
          <button class="latte-modal__close" data-close="modal-transaction">✕</button>
        </div>
        <div class="latte-modal__body">
          <div class="latte-tx-tabs">
            <button class="latte-tx-tab latte-tx-tab--active" data-type="expense">Pengeluaran</button>
            <button class="latte-tx-tab" data-type="income">Pemasukan</button>
            <button class="latte-tx-tab" data-type="transfer">Transfer</button>
          </div>
          <form id="form-transaction" novalidate>
            <div class="latte-form-group" id="fg-from-account">
              <label class="latte-label" id="label-from-account">Dari Akun</label>
              <select class="latte-select" id="tx-from-account" required>
                <option value="">Pilih akun...</option>
                ${accounts.map((a: any) => `<option value="${a.id}">${a.name} (${formatIDR(a.balance)})</option>`).join('')}
              </select>
            </div>
            <div class="latte-form-group" id="fg-to-account" style="display:none">
              <label class="latte-label">Ke Akun</label>
              <select class="latte-select" id="tx-to-account">
                <option value="">Pilih akun tujuan...</option>
                ${accounts.map((a: any) => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>
            <div class="latte-form-group" id="fg-category">
              <label class="latte-label">Kategori</label>
              <select class="latte-select" id="tx-category" required>
                ${CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="latte-form-group">
              <label class="latte-label">Jumlah</label>
              <div class="latte-input-group">
                <span class="latte-input-prefix">Rp</span>
                <input class="latte-input latte-input--prefixed" type="text" id="tx-amount" placeholder="Contoh: 50000 atau 1.5jt" required autocomplete="off">
              </div>
              <div class="latte-hint">Bisa: 50000, 50k, 1.5jt, 2000000</div>
            </div>
            <div class="latte-form-group" id="fg-fee" style="display:none">
              <label class="latte-label">Biaya Admin (opsional)</label>
              <div class="latte-input-group">
                <span class="latte-input-prefix">Rp</span>
                <input class="latte-input latte-input--prefixed" type="text" id="tx-fee" placeholder="Contoh: 6500" autocomplete="off">
              </div>
            </div>
            <div class="latte-form-group">
              <label class="latte-label">Tanggal</label>
              <input class="latte-input" type="date" id="tx-date" required>
            </div>
            <button type="submit" class="latte-btn latte-btn--primary latte-btn--full">Simpan Transaksi</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderAccountModal() {
  return `
    <div class="latte-modal-overlay" id="modal-account" aria-hidden="true">
      <div class="latte-modal">
        <div class="latte-modal__header">
          <h3 class="latte-modal__title">Tambah Akun</h3>
          <button class="latte-modal__close" data-close="modal-account">✕</button>
        </div>
        <div class="latte-modal__body">
          <form id="form-account" novalidate>
            <div class="latte-form-group">
              <label class="latte-label">Nama Akun</label>
              <input class="latte-input" type="text" id="acc-name" placeholder="Contoh: BCA, GoPay, Dompet" required maxlength="30">
            </div>
            <div class="latte-form-group">
              <label class="latte-label">Saldo Awal</label>
              <div class="latte-input-group">
                <span class="latte-input-prefix">Rp</span>
                <input class="latte-input latte-input--prefixed" type="text" id="acc-balance" placeholder="Contoh: 1500000 atau 1.5jt" autocomplete="off">
              </div>
            </div>
            <button type="submit" class="latte-btn latte-btn--primary latte-btn--full">Tambah Akun</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderBudgetModal() {
  return `
    <div class="latte-modal-overlay" id="modal-budget" aria-hidden="true">
      <div class="latte-modal">
        <div class="latte-modal__header">
          <h3 class="latte-modal__title">Set Budget Kategori</h3>
          <button class="latte-modal__close" data-close="modal-budget">✕</button>
        </div>
        <div class="latte-modal__body">
          <form id="form-budget" novalidate>
            <div class="latte-form-group">
              <label class="latte-label">Kategori</label>
              <select class="latte-select" id="budget-category" required>
                ${CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="latte-form-group">
              <label class="latte-label">Limit per Bulan</label>
              <div class="latte-input-group">
                <span class="latte-input-prefix">Rp</span>
                <input class="latte-input latte-input--prefixed" type="text" id="budget-limit" placeholder="Contoh: 500000 atau 500k" required autocomplete="off">
              </div>
            </div>
            <button type="submit" class="latte-btn latte-btn--primary latte-btn--full">Simpan Budget</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// MODAL CONTROLS
// ─────────────────────────────────────────────
function openModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('latte-modal-overlay--open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('latte-modal-overlay--open');
    document.body.style.overflow = '';
    // Reset forms inside modal
    const form = modal.querySelector('form') as HTMLFormElement;
    if (form) form.reset();
  }
}

function openTransactionModal() {
  const accounts = getAccounts();
  if (accounts.length === 0) {
    showToast('Tambah akun dulu sebelum mencatat transaksi!', 'error');
    currentPage = 'accounts';
    renderApp();
    setTimeout(() => openModal('modal-account'), 100);
    return;
  }
  openModal('modal-transaction');
  // Set today's date after modal opens
  setTimeout(() => {
    const dateInput = document.getElementById('tx-date') as HTMLInputElement;
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    // Reset tabs to expense
    document.querySelectorAll('.latte-tx-tab').forEach(t => t.classList.remove('latte-tx-tab--active'));
    const expenseTab = document.querySelector('[data-type="expense"]');
    if (expenseTab) {
      expenseTab.classList.add('latte-tx-tab--active');
      updateTransactionFormForType('expense');
    }
  }, 50);
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
function attachEventListeners() {
  // Theme toggle
  document.getElementById('btn-theme')?.addEventListener('click', () => {
    const s = getSettings();
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    saveSettings({ theme: newTheme });
    renderApp();
  });

  // Privacy toggle
  document.getElementById('btn-privacy')?.addEventListener('click', () => {
    const s = getSettings();
    saveSettings({ privacy: !s.privacy });
    renderApp();
  });

  // Nav
  document.querySelectorAll('.latte-nav__item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = (e.currentTarget as HTMLElement).dataset.page;
      if (page) { currentPage = page; renderApp(); }
    });
  });

  // Internal links
  document.querySelectorAll('[data-page]').forEach(btn => {
    if (!btn.classList.contains('latte-nav__item')) {
      btn.addEventListener('click', (e) => {
        const page = (e.currentTarget as HTMLElement).dataset.page;
        if (page) { currentPage = page; renderApp(); }
      });
    }
  });

  // Period filter
  document.querySelectorAll('.latte-period-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const period = (e.currentTarget as HTMLElement).dataset.period;
      if (period) { currentPeriod = period; renderApp(); }
    });
  });

  // FAB
  document.getElementById('btn-fab')?.addEventListener('click', openTransactionModal);

  // Onboarding
  document.getElementById('btn-add-account-onboard')?.addEventListener('click', () => openModal('modal-account'));
  document.getElementById('btn-add-account')?.addEventListener('click', () => openModal('modal-account'));
  document.getElementById('btn-add-budget')?.addEventListener('click', () => openModal('modal-budget'));

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.close;
      if (id) closeModal(id);
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.latte-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Escape key closes open modals
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      ['modal-transaction', 'modal-account', 'modal-budget'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('latte-modal-overlay--open')) closeModal(id);
      });
    }
  };
  document.removeEventListener('keydown', escHandler as EventListener);
  document.addEventListener('keydown', escHandler as EventListener);

  // Transaction type tabs
  document.querySelectorAll('.latte-tx-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const type = (e.currentTarget as HTMLElement).dataset.type as string;
      document.querySelectorAll('.latte-tx-tab').forEach(t => t.classList.remove('latte-tx-tab--active'));
      (e.currentTarget as HTMLElement).classList.add('latte-tx-tab--active');
      updateTransactionFormForType(type);
    });
  });

  // Transaction form
  document.getElementById('form-transaction')?.addEventListener('submit', handleTransactionSubmit);

  // Account form
  document.getElementById('form-account')?.addEventListener('submit', handleAccountSubmit);

  // Budget form
  document.getElementById('form-budget')?.addEventListener('submit', handleBudgetSubmit);

  // Delete transaction
  document.querySelectorAll('.latte-tx__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.txId;
      if (id) {
        const tx = getTransactions().find((t: any) => t.id === id);
        if (tx) {
          reverseTransaction(tx);
          showToast('Transaksi dihapus', 'info');
          renderApp();
        }
      }
    });
  });

  // Delete account
  document.querySelectorAll('.latte-account__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.accountId;
      if (id) {
        deleteAccount(id);
        showToast('Akun dihapus', 'info');
        renderApp();
      }
    });
  });

  // Delete budget
  document.querySelectorAll('.latte-budget__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = (e.currentTarget as HTMLElement).dataset.budgetCat;
      if (cat) {
        deleteBudget(cat);
        showToast(`Budget ${cat} dihapus`, 'info');
        renderApp();
      }
    });
  });
}

function updateTransactionFormForType(type: string) {
  const fgFrom = document.getElementById('fg-from-account');
  const fgTo = document.getElementById('fg-to-account');
  const fgFee = document.getElementById('fg-fee');
  const fgCat = document.getElementById('fg-category');
  const labelFrom = document.getElementById('label-from-account');
  const catSelect = document.getElementById('tx-category') as HTMLSelectElement;

  if (type === 'expense') {
    fgFrom?.style && (fgFrom.style.display = '');
    fgTo?.style && (fgTo.style.display = 'none');
    fgFee?.style && (fgFee.style.display = 'none');
    fgCat?.style && (fgCat.style.display = '');
    if (labelFrom) labelFrom.textContent = 'Dari Akun';
    if (catSelect) catSelect.innerHTML = CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('');
  } else if (type === 'income') {
    fgFrom?.style && (fgFrom.style.display = '');
    fgTo?.style && (fgTo.style.display = 'none');
    fgFee?.style && (fgFee.style.display = 'none');
    fgCat?.style && (fgCat.style.display = '');
    if (labelFrom) labelFrom.textContent = 'Ke Akun';
    if (catSelect) catSelect.innerHTML = CATEGORIES.income.map(c => `<option value="${c}">${c}</option>`).join('');
  } else if (type === 'transfer') {
    fgFrom?.style && (fgFrom.style.display = '');
    fgTo?.style && (fgTo.style.display = '');
    fgFee?.style && (fgFee.style.display = '');
    fgCat?.style && (fgCat.style.display = 'none');
    if (labelFrom) labelFrom.textContent = 'Dari Akun';
  }
}

function handleTransactionSubmit(e: Event) {
  e.preventDefault();
  const activeTab = document.querySelector('.latte-tx-tab--active') as HTMLElement;
  const type = activeTab?.dataset.type || 'expense';

  const amountRaw = (document.getElementById('tx-amount') as HTMLInputElement)?.value;
  const feeRaw = (document.getElementById('tx-fee') as HTMLInputElement)?.value;
  const dateVal = (document.getElementById('tx-date') as HTMLInputElement)?.value;
  const fromAccId = (document.getElementById('tx-from-account') as HTMLSelectElement)?.value;
  const toAccId = (document.getElementById('tx-to-account') as HTMLSelectElement)?.value;
  const categoryVal = (document.getElementById('tx-category') as HTMLSelectElement)?.value;

  const amount = parseAmount(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    showToast('Masukkan jumlah yang valid!', 'error'); return;
  }

  if (!dateVal) { showToast('Pilih tanggal transaksi!', 'error'); return; }

  const tx: any = {
    id: generateId(),
    type,
    amount,
    category: type === 'transfer' ? 'Transfer' : categoryVal,
    date: new Date(dateVal).toISOString(),
  };

  if (type === 'expense') {
    if (!fromAccId) { showToast('Pilih akun sumber!', 'error'); return; }
    tx.fromAccountId = fromAccId;
  } else if (type === 'income') {
    if (!fromAccId) { showToast('Pilih akun tujuan!', 'error'); return; }
    tx.toAccountId = fromAccId;
  } else if (type === 'transfer') {
    if (!fromAccId) { showToast('Pilih akun sumber!', 'error'); return; }
    if (!toAccId) { showToast('Pilih akun tujuan!', 'error'); return; }
    if (fromAccId === toAccId) { showToast('Akun sumber dan tujuan tidak boleh sama!', 'error'); return; }
    tx.fromAccountId = fromAccId;
    tx.toAccountId = toAccId;
    const fee = parseAmount(feeRaw);
    if (!isNaN(fee) && fee > 0) tx.fee = fee;
  }

  const result = processTransaction(tx);
  if (result.ok) {
    closeModal('modal-transaction');
    (document.getElementById('form-transaction') as HTMLFormElement)?.reset();
    showToast('Transaksi berhasil disimpan! ✅', 'success');
    renderApp();
  } else {
    showToast(result.error || 'Gagal menyimpan transaksi', 'error');
  }
}

function handleAccountSubmit(e: Event) {
  e.preventDefault();
  const name = (document.getElementById('acc-name') as HTMLInputElement)?.value.trim();
  const balanceRaw = (document.getElementById('acc-balance') as HTMLInputElement)?.value;

  if (!name) { showToast('Masukkan nama akun!', 'error'); return; }

  const balance = balanceRaw ? parseAmount(balanceRaw) : 0;
  const finalBalance = isNaN(balance) ? 0 : balance;

  addAccount({ id: generateId(), name, balance: finalBalance });
  closeModal('modal-account');
  (document.getElementById('form-account') as HTMLFormElement)?.reset();
  showToast(`Akun "${name}" berhasil ditambahkan! 🏦`, 'success');
  renderApp();
}

function handleBudgetSubmit(e: Event) {
  e.preventDefault();
  const cat = (document.getElementById('budget-category') as HTMLSelectElement)?.value;
  const limitRaw = (document.getElementById('budget-limit') as HTMLInputElement)?.value;
  const limit = parseAmount(limitRaw);

  if (!cat) { showToast('Pilih kategori!', 'error'); return; }
  if (isNaN(limit) || limit <= 0) { showToast('Masukkan limit yang valid!', 'error'); return; }

  upsertBudget({ category: cat, limit, period: 'monthly' });
  closeModal('modal-budget');
  (document.getElementById('form-budget') as HTMLFormElement)?.reset();
  showToast(`Budget ${cat} berhasil disimpan! 🎯`, 'success');
  renderApp();
}

// ─────────────────────────────────────────────
// APP INIT
// ─────────────────────────────────────────────
function initApp() {
  // Auto-detect theme
  if (!localStorage.getItem(STORAGE_KEY)) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    saveSettings({ theme: prefersDark ? 'dark' : 'light' });
  }

  renderApp();

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('latte_theme_manual')) {
      saveSettings({ theme: e.matches ? 'dark' : 'light' });
      renderApp();
    }
  });
}
