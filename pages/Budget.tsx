import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { getCategoryById } from '../data/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { startOfMonth, parseISO, isAfter, isBefore, endOfMonth } from 'date-fns';
import { TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg text-xs border border-gray-100 dark:border-gray-700">
        <p className="font-bold text-gray-800 dark:text-white">{payload[0].name}</p>
        <p className="text-gray-500">${payload[0].value.toFixed(2)}</p>
        <p className="text-amber-600">{payload[0].payload.percent?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export const Budget: React.FC = () => {
  const { transactions, budgets } = useApp();
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Calculate spending per category this month
  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const d = parseISO(t.date);
      if (isAfter(d, monthEnd) || isBefore(d, monthStart)) return;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    return map;
  }, [transactions, monthStart, monthEnd]);

  const totalExpense = Array.from(categorySpending.values()).reduce((s, v) => s + v, 0);

  // Pie data
  const pieData = useMemo(() => {
    const data: { name: string; value: number; icon: string; color: string; percent: number }[] = [];
    categorySpending.forEach((amount, catId) => {
      const cat = getCategoryById(catId);
      if (!cat || amount === 0) return;
      data.push({
        name: cat.name,
        value: amount,
        icon: cat.icon,
        color: cat.color,
        percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      });
    });
    return data.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [categorySpending, totalExpense]);

  // Budgets with spending
  const budgetsWithSpend = useMemo(() =>
    budgets.map(b => ({
      ...b,
      spent: categorySpending.get(b.categoryId) ?? 0,
    })),
    [budgets, categorySpending]
  );

  const overBudget = budgetsWithSpend.filter(b => b.spent > b.limit);
  const nearBudget = budgetsWithSpend.filter(b => b.spent >= b.limit * 0.7 && b.spent <= b.limit);
  const onTrack = budgetsWithSpend.filter(b => b.spent < b.limit * 0.7);

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-1">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
          <p className="text-lg font-black text-red-500">{overBudget.length}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Over budget</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-1">
            <TrendingDown size={14} className="text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-600">{nearBudget.length}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Near limit</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-1">
            <CheckCircle size={14} className="text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-500">{onTrack.length}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">On track</p>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">Expense Breakdown</h3>
          <Badge variant="neutral" className="text-xs">This month</Badge>
        </div>

        {pieData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">No expense data yet</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveSlice(index)}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                          opacity={activeSlice === null || activeSlice === index ? 1 : 0.5}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
                  <p className="text-xl font-black text-gray-800 dark:text-white">${totalExpense.toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {pieData.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 cursor-pointer"
                  onMouseEnter={() => setActiveSlice(i)}
                  onMouseLeave={() => setActiveSlice(null)}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{entry.icon} {entry.name}</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 ml-auto">{entry.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Budget bars */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-4">Monthly Budgets</h3>
        <div className="space-y-4">
          {budgetsWithSpend.map(b => {
            const cat = getCategoryById(b.categoryId);
            const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
            const remaining = b.limit - b.spent;
            const isOver = b.spent > b.limit;
            const isNear = pct >= 70 && pct < 100;

            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat?.icon}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{cat?.name}</span>
                    {isOver && <Badge variant="expense">Over</Badge>}
                    {isNear && <Badge variant="gold">⚠️ Near</Badge>}
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-bold', isOver ? 'text-red-500' : 'text-gray-700 dark:text-gray-300')}>
                      ${b.spent.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500"> / ${b.limit}</span>
                  </div>
                </div>
                <ProgressBar value={pct} />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{pct.toFixed(0)}% used</span>
                  <span className={cn(
                    'text-[10px] font-semibold',
                    isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {isOver ? `$${Math.abs(remaining).toFixed(0)} over` : `$${remaining.toFixed(0)} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top spenders this month */}
      <Card className="p-4">
        <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-3">Top Spending Categories</h3>
        <div className="space-y-2">
          {pieData.slice(0, 5).map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm w-6 text-center">{i + 1}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: entry.color + '20' }}>
                {entry.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{entry.name}</span>
                  <span className="text-xs font-bold text-red-500">-${entry.value.toFixed(2)}</span>
                </div>
                <ProgressBar value={entry.percent} size="sm" color="gold" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
