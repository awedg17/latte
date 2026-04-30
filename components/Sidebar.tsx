import React from 'react';
import { useApp } from '../context/AppContext';
import { AppPage } from '../types';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Wallet,
  Moon, Sun, Plus, Sparkles
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  onAddTransaction: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={19} /> },
  { id: 'budget', label: 'Budget', icon: <PieChart size={19} /> },
  { id: 'accounts', label: 'Accounts', icon: <Wallet size={19} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ onAddTransaction }) => {
  const { activePage, setActivePage, darkMode, toggleDarkMode } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
            <Sparkles size={18} className="text-gray-900" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight">FinTrack</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="px-4 mb-4">
        <button
          onClick={onAddTransaction}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold text-sm shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 hover:from-amber-500 hover:to-yellow-600 transition-all active:scale-95"
        >
          <div className="w-5 h-5 rounded-full bg-gray-900/15 flex items-center justify-center">
            <Plus size={12} className="text-gray-900" />
          </div>
          Add Transaction
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              activePage === item.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white'
            )}
          >
            <span className={cn(
              activePage === item.id ? 'text-white dark:text-gray-900' : 'text-gray-400 dark:text-gray-500'
            )}>
              {item.icon}
            </span>
            {item.label}
            {activePage === item.id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </nav>

      {/* Dark mode toggle + user */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
          <div className={cn(
            'ml-auto w-9 h-5 rounded-full transition-colors relative',
            darkMode ? 'bg-amber-400' : 'bg-gray-200'
          )}>
            <div className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              darkMode ? 'translate-x-4' : 'translate-x-0.5'
            )} />
          </div>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 mt-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-sm font-black text-gray-900">
            A
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Alex Johnson</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Pro Plan</p>
          </div>
          <Sparkles size={12} className="ml-auto text-amber-400" />
        </div>
      </div>
    </aside>
  );
};
