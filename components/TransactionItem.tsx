import React, { useState } from 'react';
import { Transaction } from '../types';
import { getCategoryById, getAccountById } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { format, parseISO } from 'date-fns';

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
  compact?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showDate = false, compact = false }) => {
  const { deleteTransaction, accounts } = useApp();
  const [showDelete, setShowDelete] = useState(false);
  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId, accounts);
  const isIncome = transaction.type === 'income';

  return (
    <div
      className={cn(
        'flex items-center gap-3 group cursor-pointer select-none',
        compact ? 'py-2.5' : 'py-3',
        'border-b border-gray-50 dark:border-gray-700/50 last:border-0'
      )}
      onClick={() => setShowDelete(s => !s)}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: (category?.color ?? '#888') + '18' }}
      >
        {category?.icon ?? '📦'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {category?.name ?? 'Unknown'}
          </p>
          <span className={cn(
            'text-sm font-bold ml-2 flex-shrink-0',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}>
            {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {account?.icon} {account?.name}
            </span>
            {transaction.note && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
                  {transaction.note}
                </span>
              </>
            )}
          </div>
          {showDate && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {format(parseISO(transaction.date), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {/* Delete / Arrow */}
      {showDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); deleteTransaction(transaction.id); setShowDelete(false); }}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};
