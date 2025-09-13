

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

export interface WorkDay {
  id: string;
  personnelId: string;
  date: string; // YYYY-MM-DD
  location: string;
  jobDescription: string;
  wage: number;
  hours?: number;
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
}

export interface Customer {
  id: string;
  name: string;
  contactInfo: string;
  address: string;
  jobDescription: string;
}

export interface Material {
    id: string;
    name: string;
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
  operation: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  unitPrice: number;
  income: number;
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