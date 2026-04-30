import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { TransactionItem } from '../components/TransactionItem';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { format, parseISO } from 'date-fns';
import { CATEGORY_GROUPS, ALL_CATEGORIES } from '../data/mockData';

type FilterType = 'all' | 'income' | 'expense';

export const Transactions: React.FC = () => {
  const { transactions } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const now = new Date();

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (search) {
        const cat = ALL_CATEGORIES.find(c => c.id === t.categoryId);
        const searchLower = search.toLowerCase();
        if (
          !cat?.name.toLowerCase().includes(searchLower) &&
          !t.note.toLowerCase().includes(searchLower)
        ) return false;
      }
      return true;
    });
  }, [transactions, filterType, selectedCategory, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(t => {
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const formatGroupDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    const today = format(now, 'yyyy-MM-dd');
    const yesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return format(d, 'EEEE, MMM d');
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border transition-colors',
            showFilters || selectedCategory
              ? 'bg-amber-400 border-amber-400 text-gray-900'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500'
          )}
        >
          <Filter size={15} />
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all',
              filterType === f
                ? f === 'income' ? 'bg-emerald-500 text-white'
                  : f === 'expense' ? 'bg-red-500 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Category filter (when expanded) */}
      {showFilters && (
        <Card className="p-4">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                !selectedCategory
                  ? 'bg-amber-400 text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              All
            </button>
            {ALL_CATEGORIES.filter(c => {
              if (filterType === 'all') return true;
              const group = CATEGORY_GROUPS.find(g => g.id === c.groupId);
              return group?.type === filterType || group?.type === 'both';
            }).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(id => id === cat.id ? null : cat.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                )}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Summary mini bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Income</p>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-300">+${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-500 dark:text-red-400 font-medium">Expenses</p>
          <p className="text-base font-black text-red-600 dark:text-red-300">-${totalExpense.toFixed(2)}</p>
        </div>
      </div>

      {/* Grouped transactions */}
      {grouped.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
        </Card>
      ) : (
        grouped.map(([date, txs]) => (
          <div key={date}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{formatGroupDate(date)}</p>
              <p className={cn(
                'text-xs font-bold',
                txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              )}>
                {txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0) >= 0 ? '+' : ''}
                ${txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0).toFixed(2)}
              </p>
            </div>
            <Card className="px-4">
              {txs.map(t => <TransactionItem key={t.id} transaction={t} />)}
            </Card>
          </div>
        ))
      )}
    </div>
  );
};
