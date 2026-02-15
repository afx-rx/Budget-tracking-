export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  date: string; // ISO string
  user_id?: string;
}

export interface UserProfile {
  name: string;
  currency: string;
  monthlyBudget: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_TRANSACTION = 'ADD_TRANSACTION',
  PROFILE = 'PROFILE',
  DETAILS = 'DETAILS',
}

export type DetailCategory = 'INCOME' | 'EXPENSE' | 'PENDING';

export type Theme = 'dark' | 'light';