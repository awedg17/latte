import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { TransactionItem } from '../components/TransactionItem';
import { TrendingUp, TrendingDown, CreditCard, Building2, PiggyBank, Coins, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';
import { Account } from '../types';
import { parseISO, startOfMonth, isAfter } from 'date-fns';

const accountIcons: Record<string, React.ReactNode> = {
  cash: <Coins size={18} />,
  bank: <Building2 size={18} />,
  credit: <CreditCard size={18} />,
  savings: <PiggyBank size={18} />,
  investment: <BarChart3 size={18} />,
};

const accountColors: Record<string, string> = {
  cash: 'from-emerald-400 to-green-500',
  bank: 'from-blue-400 to-blue-600',
  credit: 'from-red-400 to-rose-600',
  savings: 'from-amber-400 to-yellow-500',
  investment: 'from-purple-400 to-violet-600',
};

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const { transactions } = useApp();
  const monthStart = startOfMonth(new Date());

  const { income, expense, recentTxs } = useMemo(() => {
    const accTxs = transactions.filter(t => t.accountId === account.id);
    const monthTxs = accTxs.filter(t => isAfter(parseISO(t.date), monthStart) || parseISO(t.date).toDateString() === monthStart.toDateString());
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, recentTxs: accTxs.slice(0, 3) };
  }, [transactions, account.id, monthStart]);

  return (
    <Card className="overflow-hidden">
      {/* Card header with gradient */}
      <div className={cn('relative bg-gradient-to-br p-5', accountColors[account.type] ?? 'from-gray-400 to-gray-600')}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                {accountIcons[account.type]}
              </div>
              <span className="text-white/80 text-sm font-medium capitalize">{account.type}</span>
            </div>
            <h3 className="text-white font-bold text-lg">{account.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Balance</p>
            <p className={cn('text-2xl font-black text-white', account.balance < 0 && 'text-red-200')}>
              {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">In</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+${income.toFixed(0)}</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingDown size={12} className="text-red-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Out</span>
          </div>
          <p className="text-sm font-bold text-red-500 dark:text-red-400">-${expense.toFixed(0)}</p>
        </div>
      </div>

      {/* Recent transactions */}
      {recentTxs.length > 0 && (
        <div className="px-4 pb-2 border-t border-gray-50 dark:border-gray-700/50">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-3 pb-1">Recent</p>
          {recentTxs.map(t => <TransactionItem key={t.id} transaction={t} compact showDate />)}
        </div>
      )}
    </Card>
  );
};

export const Accounts: React.FC = () => {
  const { accounts } = useApp();
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0));
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Net worth card */}
      <Card className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-0">
        <p className="text-gray-400 text-sm mb-1">Net Worth</p>
        <p className="text-4xl font-black text-white mb-4">
          ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Total Assets</p>
            <p className="text-emerald-400 font-bold">${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Total Liabilities</p>
            <p className="text-red-400 font-bold">${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </Card>

      {/* Account cards */}
      {accounts.map(acc => <AccountCard key={acc.id} account={acc} />)}
    </div>
  );
};
