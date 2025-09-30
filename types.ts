
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  VIEWER = 'VIEWER',
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
  id:string;
  name: string;
  foremanId?: string;
  note?: {
    text: string;
    updatedAt: string; // ISO String
  }
}

export interface Payment {
  id: string;
  foremanId: string;
  amount: number;
  date: string; // ISO Date String
}

export type Payer = 'Ömer' | 'Barış' | 'Kasa';
export type PaymentMethod = 'cash' | 'transfer' | 'card';

export interface PersonnelPayment {
  id: string;
  personnelId: string;
  amount: number;
  date: string; // ISO Date String
  customerJobId?: string;
  payer: Payer;
  paymentMethod: PaymentMethod;
}

export interface SharedExpense {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO Date String
    paymentMethod: PaymentMethod;
    payer: Payer;
    status: 'paid' | 'unpaid';
    deletedAt?: string; // ISO String for soft delete
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
    daysWorked: number;
    paymentMethod?: PaymentMethod;
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
}

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

export type NoteCategory = 'todo' | 'reminder' | 'important';

export interface DefterNote {
  id: string;
  title: string;
  description?: string;
  category: NoteCategory;
  createdAt: string; // ISO String
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
}

export interface WorkDay {
  id: string;
  personnelId: string;
  customerJobId: string;
  date: string; // YYYY-MM-DD
  wage: number;
  location?: string;
  jobDescription?: string;
}