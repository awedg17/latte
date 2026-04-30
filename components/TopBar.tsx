import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Bell, Sparkles } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  budget: 'Budget',
  accounts: 'Accounts',
};

export const TopBar: React.FC = () => {
  const { activePage, darkMode, toggleDarkMode } = useApp();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-200/50 dark:shadow-amber-900/30">
            <Sparkles size={15} className="text-gray-900" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight">{PAGE_TITLES[activePage]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="relative w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-xs font-black text-gray-900">
            A
          </div>
        </div>
      </div>
    </header>
  );
};
