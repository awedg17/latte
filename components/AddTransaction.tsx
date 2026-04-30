import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORY_GROUPS, ALL_CATEGORIES } from '../data/mockData';
import { Transaction, TransactionType } from '../types';
import { Button } from './ui/Button';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

interface AddTransactionProps {
  onClose: () => void;
}

type Step = 1 | 2 | 3;

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose }) => {
  const { addTransaction, accounts, lastUsedAccountId, lastUsedCategoryId } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(lastUsedCategoryId);
  const [accountId, setAccountId] = useState(lastUsedAccountId);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const filteredGroups = CATEGORY_GROUPS.filter(g => g.type === type || g.type === 'both');
  const selectedCategory = ALL_CATEGORIES.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleNumpad = (key: string) => {
    if (key === 'DEL') {
      setAmount(a => a.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(a => a + '.');
    } else {
      const next = amount + key;
      if (/^\d*\.?\d{0,2}$/.test(next) && parseFloat(next) <= 999999) {
        setAmount(next);
      }
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount'); return; }
      setError('');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      type,
      amount: parseFloat(amount),
      categoryId,
      accountId,
      note,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
    };
    addTransaction(tx);
    setSuccess(true);
    setTimeout(onClose, 900);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center animate-bounce">
            <Check size={32} className="text-white" />
          </div>
          <p className="text-lg font-bold text-gray-800 dark:text-white">Transaction Added!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full sm:hidden" />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button onClick={() => setStep(s => (s - 1) as Step)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              )}
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Transaction</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <X size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn(
                'h-1 rounded-full transition-all duration-300',
                s <= step ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gray-100 dark:bg-gray-700',
                s === step ? 'flex-[2]' : 'flex-1'
              )} />
            ))}
          </div>
        </div>

        {/* STEP 1: Type + Amount */}
        {step === 1 && (
          <div className="px-6 pb-6">
            {/* Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
              {(['expense', 'income'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategoryId(t === 'expense' ? 'cat1' : 'cat23'); }}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-semibold text-sm capitalize transition-all duration-200',
                    type === t
                      ? t === 'expense'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {t === 'expense' ? '📤 Expense' : '📥 Income'}
                </button>
              ))}
            </div>

            {/* Amount display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-start gap-1">
                <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 mt-2">$</span>
                <span className={cn(
                  'text-6xl font-black tracking-tight transition-colors',
                  amount ? (type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400') : 'text-gray-200 dark:text-gray-700'
                )}>
                  {amount || '0'}
                </span>
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9','.','0','DEL'].map(k => (
                <button
                  key={k}
                  onClick={() => handleNumpad(k)}
                  className={cn(
                    'h-14 rounded-2xl font-semibold text-lg transition-all duration-100 active:scale-95',
                    k === 'DEL'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-base'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {k === 'DEL' ? '⌫' : k}
                </button>
              ))}
            </div>

            <Button variant="gold" size="lg" fullWidth onClick={goNext}>
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* STEP 2: Category */}
        {step === 2 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Select a category</p>
              <span className={cn(
                'text-sm font-bold',
                type === 'income' ? 'text-emerald-600' : 'text-red-500'
              )}>
                {type === 'income' ? '+' : '-'}${parseFloat(amount || '0').toFixed(2)}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1 custom-scroll">
              {filteredGroups.map(group => (
                <div key={group.id}>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>{group.icon}</span> {group.name}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150',
                          categoryId === cat.id
                            ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="gold" size="lg" fullWidth onClick={goNext} className="mt-4">
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* STEP 3: Account + Note + Submit */}
        {step === 3 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCategory?.icon}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{selectedCategory?.name}</span>
              </div>
              <span className={cn(
                'text-lg font-black',
                type === 'income' ? 'text-emerald-600' : 'text-red-500'
              )}>
                {type === 'income' ? '+' : '-'}${parseFloat(amount || '0').toFixed(2)}
              </span>
            </div>

            {/* Account selector */}
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Account</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
                    accountId === acc.id
                      ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{acc.icon}</span>
                  <span>{acc.name}</span>
                </button>
              ))}
            </div>

            {/* Note */}
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Note <span className="text-gray-300 dark:text-gray-600 font-normal normal-case">(optional)</span></p>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all mb-4"
            />

            {/* Account balance info */}
            {selectedAccount && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">Available in {selectedAccount.name}</span>
                <span className={cn('text-sm font-bold', selectedAccount.balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500')}>
                  ${selectedAccount.balance.toFixed(2)}
                </span>
              </div>
            )}

            <Button variant="gold" size="lg" fullWidth onClick={handleSubmit}>
              <Check size={18} /> Save Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
