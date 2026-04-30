import { Account, CategoryGroup, Transaction, Budget } from '../types';

export const ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Cash', type: 'cash', balance: 1240.50, color: '#10b981', icon: '💵' },
  { id: 'acc2', name: 'Chase Bank', type: 'bank', balance: 8420.75, color: '#3b82f6', icon: '🏦' },
  { id: 'acc3', name: 'Visa Credit', type: 'credit', balance: -1350.00, color: '#ef4444', icon: '💳' },
  { id: 'acc4', name: 'Savings', type: 'savings', balance: 15200.00, color: '#f59e0b', icon: '🏛️' },
];

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'grp1',
    name: 'Food & Drink',
    icon: '🍽️',
    type: 'expense',
    categories: [
      { id: 'cat1', name: 'Groceries', icon: '🛒', color: '#10b981', groupId: 'grp1' },
      { id: 'cat2', name: 'Restaurant', icon: '🍜', color: '#f59e0b', groupId: 'grp1' },
      { id: 'cat3', name: 'Coffee', icon: '☕', color: '#92400e', groupId: 'grp1' },
      { id: 'cat4', name: 'Delivery', icon: '🛵', color: '#ef4444', groupId: 'grp1' },
    ],
  },
  {
    id: 'grp2',
    name: 'Transport',
    icon: '🚗',
    type: 'expense',
    categories: [
      { id: 'cat5', name: 'Fuel', icon: '⛽', color: '#6366f1', groupId: 'grp2' },
      { id: 'cat6', name: 'Uber/Lyft', icon: '🚕', color: '#8b5cf6', groupId: 'grp2' },
      { id: 'cat7', name: 'Public Transit', icon: '🚇', color: '#3b82f6', groupId: 'grp2' },
      { id: 'cat8', name: 'Parking', icon: '🅿️', color: '#64748b', groupId: 'grp2' },
    ],
  },
  {
    id: 'grp3',
    name: 'Housing',
    icon: '🏠',
    type: 'expense',
    categories: [
      { id: 'cat9', name: 'Rent', icon: '🏠', color: '#f59e0b', groupId: 'grp3' },
      { id: 'cat10', name: 'Utilities', icon: '💡', color: '#eab308', groupId: 'grp3' },
      { id: 'cat11', name: 'Internet', icon: '📡', color: '#06b6d4', groupId: 'grp3' },
      { id: 'cat12', name: 'Maintenance', icon: '🔧', color: '#78716c', groupId: 'grp3' },
    ],
  },
  {
    id: 'grp4',
    name: 'Entertainment',
    icon: '🎬',
    type: 'expense',
    categories: [
      { id: 'cat13', name: 'Streaming', icon: '📺', color: '#ef4444', groupId: 'grp4' },
      { id: 'cat14', name: 'Games', icon: '🎮', color: '#7c3aed', groupId: 'grp4' },
      { id: 'cat15', name: 'Movies', icon: '🎬', color: '#dc2626', groupId: 'grp4' },
      { id: 'cat16', name: 'Sports', icon: '⚽', color: '#16a34a', groupId: 'grp4' },
    ],
  },
  {
    id: 'grp5',
    name: 'Health',
    icon: '❤️',
    type: 'expense',
    categories: [
      { id: 'cat17', name: 'Medical', icon: '🏥', color: '#ef4444', groupId: 'grp5' },
      { id: 'cat18', name: 'Pharmacy', icon: '💊', color: '#10b981', groupId: 'grp5' },
      { id: 'cat19', name: 'Gym', icon: '💪', color: '#f59e0b', groupId: 'grp5' },
    ],
  },
  {
    id: 'grp6',
    name: 'Shopping',
    icon: '🛍️',
    type: 'expense',
    categories: [
      { id: 'cat20', name: 'Clothing', icon: '👕', color: '#ec4899', groupId: 'grp6' },
      { id: 'cat21', name: 'Electronics', icon: '💻', color: '#3b82f6', groupId: 'grp6' },
      { id: 'cat22', name: 'Amazon', icon: '📦', color: '#f59e0b', groupId: 'grp6' },
    ],
  },
  {
    id: 'grp7',
    name: 'Income',
    icon: '💰',
    type: 'income',
    categories: [
      { id: 'cat23', name: 'Salary', icon: '💼', color: '#10b981', groupId: 'grp7' },
      { id: 'cat24', name: 'Freelance', icon: '🖥️', color: '#3b82f6', groupId: 'grp7' },
      { id: 'cat25', name: 'Investment', icon: '📈', color: '#f59e0b', groupId: 'grp7' },
      { id: 'cat26', name: 'Gift', icon: '🎁', color: '#ec4899', groupId: 'grp7' },
      { id: 'cat27', name: 'Bonus', icon: '🌟', color: '#eab308', groupId: 'grp7' },
    ],
  },
];

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.categories);

export const getCategoryById = (id: string) => ALL_CATEGORIES.find(c => c.id === id);
export const getGroupById = (id: string) => CATEGORY_GROUPS.find(g => g.id === id);
export const getAccountById = (id: string, accounts: Account[]) => accounts.find(a => a.id === id);

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return fmt(d);
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'income', amount: 4500, categoryId: 'cat23', accountId: 'acc2', note: 'Monthly salary', date: daysAgo(0), createdAt: new Date().toISOString() },
  { id: 't2', type: 'expense', amount: 120.50, categoryId: 'cat1', accountId: 'acc1', note: 'Weekly groceries', date: daysAgo(1), createdAt: new Date().toISOString() },
  { id: 't3', type: 'expense', amount: 45.00, categoryId: 'cat2', accountId: 'acc3', note: 'Dinner with friends', date: daysAgo(1), createdAt: new Date().toISOString() },
  { id: 't4', type: 'expense', amount: 9.99, categoryId: 'cat13', accountId: 'acc3', note: 'Netflix subscription', date: daysAgo(2), createdAt: new Date().toISOString() },
  { id: 't5', type: 'expense', amount: 65.00, categoryId: 'cat5', accountId: 'acc1', note: 'Gas station', date: daysAgo(2), createdAt: new Date().toISOString() },
  { id: 't6', type: 'income', amount: 850, categoryId: 'cat24', accountId: 'acc2', note: 'Website project', date: daysAgo(3), createdAt: new Date().toISOString() },
  { id: 't7', type: 'expense', amount: 1200, categoryId: 'cat9', accountId: 'acc2', note: 'Monthly rent', date: daysAgo(3), createdAt: new Date().toISOString() },
  { id: 't8', type: 'expense', amount: 34.99, categoryId: 'cat3', accountId: 'acc1', note: 'Coffee shop week', date: daysAgo(4), createdAt: new Date().toISOString() },
  { id: 't9', type: 'expense', amount: 89.00, categoryId: 'cat19', accountId: 'acc3', note: 'Gym membership', date: daysAgo(5), createdAt: new Date().toISOString() },
  { id: 't10', type: 'expense', amount: 250.00, categoryId: 'cat20', accountId: 'acc3', note: 'New jacket', date: daysAgo(6), createdAt: new Date().toISOString() },
  { id: 't11', type: 'income', amount: 200, categoryId: 'cat26', accountId: 'acc1', note: 'Birthday gift', date: daysAgo(7), createdAt: new Date().toISOString() },
  { id: 't12', type: 'expense', amount: 120, categoryId: 'cat10', accountId: 'acc2', note: 'Electric bill', date: daysAgo(8), createdAt: new Date().toISOString() },
  { id: 't13', type: 'expense', amount: 79.99, categoryId: 'cat14', accountId: 'acc3', note: 'Steam games', date: daysAgo(9), createdAt: new Date().toISOString() },
  { id: 't14', type: 'expense', amount: 55.00, categoryId: 'cat6', accountId: 'acc1', note: 'Weekend rides', date: daysAgo(10), createdAt: new Date().toISOString() },
  { id: 't15', type: 'income', amount: 500, categoryId: 'cat25', accountId: 'acc4', note: 'Dividend payout', date: daysAgo(12), createdAt: new Date().toISOString() },
  { id: 't16', type: 'expense', amount: 18.50, categoryId: 'cat4', accountId: 'acc1', note: 'Lunch delivery', date: daysAgo(13), createdAt: new Date().toISOString() },
  { id: 't17', type: 'expense', amount: 199.00, categoryId: 'cat21', accountId: 'acc3', note: 'Headphones', date: daysAgo(14), createdAt: new Date().toISOString() },
  { id: 't18', type: 'expense', amount: 45.00, categoryId: 'cat11', accountId: 'acc2', note: 'Internet bill', date: daysAgo(15), createdAt: new Date().toISOString() },
  { id: 't19', type: 'expense', amount: 30.00, categoryId: 'cat7', accountId: 'acc1', note: 'Monthly transit pass', date: daysAgo(16), createdAt: new Date().toISOString() },
  { id: 't20', type: 'income', amount: 300, categoryId: 'cat27', accountId: 'acc2', note: 'Performance bonus', date: daysAgo(18), createdAt: new Date().toISOString() },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b1', categoryId: 'cat1', limit: 400, period: 'monthly', spent: 0 },
  { id: 'b2', categoryId: 'cat2', limit: 200, period: 'monthly', spent: 0 },
  { id: 'b3', categoryId: 'cat5', limit: 150, period: 'monthly', spent: 0 },
  { id: 'b4', categoryId: 'cat9', limit: 1200, period: 'monthly', spent: 0 },
  { id: 'b5', categoryId: 'cat13', limit: 30, period: 'monthly', spent: 0 },
  { id: 'b6', categoryId: 'cat19', limit: 100, period: 'monthly', spent: 0 },
  { id: 'b7', categoryId: 'cat20', limit: 300, period: 'monthly', spent: 0 },
];
