import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TransactionItem } from '../components/TransactionItem';
import { TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight, Wallet } from 'lucide-react';
import { cn } from '../utils/cn';
import { startOfMonth, parseISO, isAfter } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-100 dark:border-gray-700 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold">
            {p.name === 'income' ? '+' : '-'}${p.value.toFixed(0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { accounts, transactions } = useApp();
  const [hideBalance, setHideBalance] = useState(false);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const totalBalance = useMemo(() =>
    accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const monthStart = startOfMonth(new Date());

  const { monthIncome, monthExpense } = useMemo(() => {
    let monthIncome = 0, monthExpense = 0;
    transactions.forEach(t => {
      const d = parseISO(t.date);
      if (isAfter(d, monthStart) || d.toDateString() === monthStart.toDateString()) {
        if (t.type === 'income') monthIncome += t.amount;
        else monthExpense += t.amount;
      }
    });
    return { monthIncome, monthExpense };
  }, [transactions, monthStart]);

  // Chart data: last 7 days
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const label = format(day, 'EEE');
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTxs = transactions.filter(t => t.date === dayStr);
      return {
        label,
        income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!activeAccount) return transactions.slice(0, 8);
    return transactions.filter(t => t.accountId === activeAccount).slice(0, 8);
  }, [transactions, activeAccount]);

  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 shadow-2xl">
        {/* Gold accent blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-sm font-medium">Total Balance</span>
            <button
              onClick={() => setHideBalance(h => !h)}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="flex items-end gap-3 mb-4">
            <h1 className="text-4xl font-black text-white tracking-tight">
              {hideBalance ? '••••••' : `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </h1>
            <Badge variant="gold" className="mb-1">
              {savingsRate >= 0 ? `+${savingsRate}%` : `${savingsRate}%`} saved
            </Badge>
          </div>

          {/* Income vs Expense mini bars */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp size={10} className="text-emerald-400" />
                </div>
                <span className="text-gray-400 text-xs">Income</span>
              </div>
              <p className="text-emerald-400 font-bold text-lg">
                {hideBalance ? '••••' : `$${monthIncome.toLocaleString()}`}
              </p>
              <p className="text-gray-500 text-[10px] mt-0.5">This month</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown size={10} className="text-red-400" />
                </div>
                <span className="text-gray-400 text-xs">Expenses</span>
              </div>
              <p className="text-red-400 font-bold text-lg">
                {hideBalance ? '••••' : `$${monthExpense.toLocaleString()}`}
              </p>
              <p className="text-gray-500 text-[10px] mt-0.5">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveAccount(null)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
            !activeAccount
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
          )}
        >
          <Wallet size={12} /> All Accounts
        </button>
        {accounts.map(acc => (
          <button
            key={acc.id}
            onClick={() => setActiveAccount(a => a === acc.id ? null : acc.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
              activeAccount === acc.id
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
            )}
          >
            <span>{acc.icon}</span>
            <span>{acc.name}</span>
            {!hideBalance && (
              <span className={cn('font-bold', acc.balance < 0 ? 'text-red-500' : '')}>
                ${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">7-Day Overview</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Income</span>
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Expense</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-700/50" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" name="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
            <Area type="monotone" dataKey="expense" name="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">Recent Transactions</h3>
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
          >
            See all <ArrowRight size={12} />
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div>
            {filteredTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} showDate />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
