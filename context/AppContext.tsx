import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Account, Budget, AppPage } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, ACCOUNTS } from '../data/mockData';

interface AppContextType {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  darkMode: boolean;
  activePage: AppPage;
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setActivePage: (p: AppPage) => void;
  toggleDarkMode: () => void;
  lastUsedAccountId: string;
  lastUsedCategoryId: string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [budgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [lastUsedAccountId, setLastUsedAccountId] = useState('acc2');
  const [lastUsedCategoryId, setLastUsedCategoryId] = useState('cat1');

  useEffect(() => {
    const saved = localStorage.getItem('fintrack_dark');
    if (saved === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('fintrack_dark', String(darkMode));
  }, [darkMode]);

  const addTransaction = useCallback((t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    setLastUsedAccountId(t.accountId);
    setLastUsedCategoryId(t.categoryId);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== t.accountId) return acc;
      const delta = t.type === 'income' ? t.amount : -t.amount;
      return { ...acc, balance: acc.balance + delta };
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      return { ...acc, balance: acc.balance + delta };
    }));
  }, [transactions]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  return (
    <AppContext.Provider value={{
      transactions, accounts, budgets, darkMode, activePage,
      addTransaction, deleteTransaction, setActivePage, toggleDarkMode,
      lastUsedAccountId, lastUsedCategoryId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
