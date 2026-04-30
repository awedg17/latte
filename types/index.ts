export type TransactionType = 'income' | 'expense';

export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  type: TransactionType | 'both';
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  groupId: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  period: 'monthly' | 'weekly';
  spent: number;
}

export type AppPage = 'dashboard' | 'transactions' | 'budget' | 'accounts' | 'add';
