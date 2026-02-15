import { TransactionType, TransactionStatus } from "./types";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Personal Care",
  "Travel",
  "Other"
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Refund",
  "Other"
];

export const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
];

export const MOCK_TRANSACTIONS = [
  {
    id: "1",
    title: "Grocery Shopping",
    amount: 120.50,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    category: "Food & Dining",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "2",
    title: "Freelance Project",
    amount: 1500.00,
    type: TransactionType.INCOME,
    status: TransactionStatus.COMPLETED,
    category: "Freelance",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "3",
    title: "Electric Bill",
    amount: 85.20,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.PENDING,
    category: "Utilities",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // Future date
  },
  {
    id: "4",
    title: "Netflix Subscription",
    amount: 15.99,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    category: "Entertainment",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];