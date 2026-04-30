import React from 'react';
import { useApp } from '../context/AppContext';
import { AppPage } from '../types';
import { LayoutDashboard, ArrowLeftRight, PieChart, Wallet } from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { id: 'transactions', label: 'Txns', icon: <ArrowLeftRight size={20} /> },
  { id: 'budget', label: 'Budget', icon: <PieChart size={20} /> },
  { id: 'accounts', label: 'Accounts', icon: <Wallet size={20} /> },
];

export const BottomNav: React.FC = () => {
  const { activePage, setActivePage } = useApp();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-2 pb-safe">
      <div className="flex items-center justify-around py-1">
        {NAV_ITEMS.slice(0, 2).map(item => (
          <NavBtn key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />
        ))}

        {/* Center spacer for FAB */}
        <div className="w-16" />

        {NAV_ITEMS.slice(2).map(item => (
          <NavBtn key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />
        ))}
      </div>
    </nav>
  );
};

const NavBtn: React.FC<{
  item: typeof NAV_ITEMS[0];
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
      active
        ? 'text-gray-900 dark:text-white'
        : 'text-gray-400 dark:text-gray-500'
    )}
  >
    <span className={cn(
      'transition-all duration-200',
      active && 'scale-110'
    )}>
      {item.icon}
    </span>
    <span className={cn(
      'text-[10px] font-semibold transition-all',
      active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
    )}>
      {item.label}
    </span>
    {active && (
      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" style={{ position: 'static', display: 'block' }} />
    )}
  </button>
);
