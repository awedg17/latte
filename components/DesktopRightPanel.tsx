import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { getCategoryById } from '../data/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { startOfMonth, endOfMonth, parseISO, isAfter, isBefore } from 'date-fns';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { cn } from '../utils/cn';

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg text-xs border border-gray-100 dark:border-gray-700">
        <p className="font-bold">{payload[0].name}</p>
        <p className="text-gray-500">${payload[0].value.toFixed(2)} · {payload[0].payload.percent?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export const DesktopRightPanel: React.FC = () => {
  const { transactions, budgets, accounts } = useApp();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const { monthIncome, monthExpense, categorySpending } = useMemo(() => {
    let monthIncome = 0, monthExpense = 0;
    const map = new Map<string, number>();
    transactions.forEach(t => {
      const d = parseISO(t.date);
      if (isAfter(d, monthEnd) || isBefore(d, monthStart)) return;
      if (t.type === 'income') monthIncome += t.amount;
      else {
        monthExpense += t.amount;
        map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
      }
    });
    return { monthIncome, monthExpense, categorySpending: map };
  }, [transactions, monthStart, monthEnd]);

  const pieData = useMemo(() => {
    const data: { name: string; value: number; icon: string; color: string; percent: number }[] = [];
    categorySpending.forEach((amount, catId) => {
      const cat = getCategoryById(catId);
      if (!cat || amount === 0) return;
      data.push({ name: cat.name, value: amount, icon: cat.icon, color: cat.color, percent: monthExpense > 0 ? (amount / monthExpense) * 100 : 0 });
    });
    return data.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [categorySpending, monthExpense]);

  const budgetsWithSpend = useMemo(() =>
    budgets.slice(0, 4).map(b => ({ ...b, spent: categorySpending.get(b.categoryId) ?? 0 })),
    [budgets, categorySpending]
  );

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const netFlow = monthIncome - monthExpense;

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-screen sticky top-0 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 border-l border-gray-100 dark:border-gray-800 p-4 space-y-4">
      {/* Monthly summary */}
      <Card className="p-4">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">This Month</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp size={13} className="text-emerald-600" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Income</span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+${monthIncome.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown size={13} className="text-red-500" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
            </div>
            <span className="font-bold text-red-500 dark:text-red-400">-${monthExpense.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Net Flow</span>
            <span className={cn('font-black', netFlow >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {netFlow >= 0 ? '+' : ''}${netFlow.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Pie chart */}
      <Card className="p-4">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Expense Split</p>
        {pieData.length > 0 ? (
          <>
            <div className="flex justify-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, i) => setActiveIdx(i)}
                      onMouseLeave={() => setActiveIdx(null)}
                    >
                      {pieData.map((e, i) => (
                        <Cell
                          key={i}
                          fill={e.color || COLORS[i % COLORS.length]}
                          opacity={activeIdx === null || activeIdx === i ? 1 : 0.4}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400">spent</p>
                  <p className="text-base font-black text-gray-800 dark:text-white">${monthExpense.toFixed(0)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              {pieData.map((e, i) => (
                <div key={i} className="flex items-center gap-2" onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color || COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 flex-1 truncate">{e.icon} {e.name}</span>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">{e.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400"><p className="text-sm">No data yet</p></div>
        )}
      </Card>

      {/* Budget progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Budget Status</p>
          <Target size={13} className="text-amber-500" />
        </div>
        <div className="space-y-3">
          {budgetsWithSpend.map(b => {
            const cat = getCategoryById(b.categoryId);
            const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{cat?.icon} {cat?.name}</span>
                  <span className={cn('text-xs font-bold', pct >= 100 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300')}>
                    ${b.spent.toFixed(0)} / ${b.limit}
                  </span>
                </div>
                <ProgressBar value={pct} size="sm" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Accounts quick view */}
      <Card className="p-4">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Accounts</p>
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{acc.icon}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{acc.name}</span>
              </div>
              <span className={cn('text-sm font-bold', acc.balance < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white')}>
                {acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-sm font-black text-gray-900 dark:text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
};
