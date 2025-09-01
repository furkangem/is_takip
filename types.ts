export enum Role {
  ADMIN = 'ADMIN',
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
  foremanId: string;
}

export interface WorkDay {
  id: string;
  personnelId: string;
  date: string; // YYYY-MM-DD
  location: string;
  jobDescription: string;
  wage: number;
}

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