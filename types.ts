


export enum Role {
  ADMIN = 'ADMIN',
  // FIX: Add FOREMAN role to support foreman-specific views and logic.
  FOREMAN = 'FOREMAN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be a hash
  role: Role;
}

export interface Personnel {
  id: string;
  name: string;
  // FIX: Add optional foremanId to link personnel to a foreman.
  foremanId?: string;
}

// FIX: Add missing Payment interface for foreman payments, which was causing compilation errors.
export interface Payment {
  id: string;
  foremanId: string;
  amount: number;
  date: string; // ISO Date String
}

export interface PersonnelPayment {
  id: string;
  personnelId: string;
  amount: number;
  date: string; // ISO Date String
  customerJobId?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactInfo: string;
  address: string;
  jobDescription: string;
}

export type IncomePaymentMethod = 'TRY' | 'USD' | 'EUR' | 'GOLD';
export type GoldType = 'gram' | 'quarter' | 'full';

export interface Material {
    id: string;
    name: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
}

export interface JobPersonnelPayment {
    personnelId: string;
    payment: number;
}

export interface CustomerJob {
  id: string;
  customerId: string;
  location: string;
  description: string; // Replaced operation, quantity, unit, and unitPrice
  date: string; // YYYY-MM-DD
  income: number;
  incomePaymentMethod?: IncomePaymentMethod;
  incomeGoldType?: GoldType;
  personnelIds: string[];
  personnelPayments: JobPersonnelPayment[];
  materials: Material[];
  otherExpenses: number;
}

// FIX: Add Income and Expense interfaces for extra financial transactions.
export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO Date String
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO Date String
}

export type PaymentMethod = 'cash' | 'transfer' | 'card';

export interface DefterEntry {
  id: string;
  date: string; // YYYY-MM-DD - Entry creation date
  description: string;
  amount: number;
  type: 'income' | 'expense'; // income = alacak, expense = verecek/borç
  status: 'paid' | 'unpaid';
  dueDate?: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface DefterNote {
  id: string;
  content: string;
  createdAt: string; // ISO String
  completed: boolean;
}

export type Payer = 'Ömer' | 'Barış' | 'Kasa';

export interface SharedExpense {
  id: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  payer: Payer;
  date: string; // ISO string with time
  status: 'paid' | 'unpaid';
}
// FIX: Add missing WorkDay interface. This was causing compilation errors in multiple components.
export interface WorkDay {
  id: string;
  personnelId: string;
  date: string; // YYYY-MM-DD
  location: string;
  jobDescription: string;
  wage: number;
}