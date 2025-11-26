export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  VIEWER = 'VIEWER',
  FOREMAN = 'FOREMAN',
}

export interface User {
  id: number; // string'den number'a değiştirildi
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Personnel {
  id: number; // string'den number'a değiştirildi
  name: string;
  foremanId?: number; // string'den number'a değiştirildi
  note?: {
    text: string;
    updatedAt: string;
  }
}

export interface Payment {
  id: number; // string'den number'a değiştirildi
  foremanId: number; // string'den number'a değiştirildi
  amount: number;
  date: string;
}

export type Payer = 'Omer' | 'Baris' | 'Kasa';
export type PaymentMethod = 'cash' | 'transfer' | 'card';

export interface PersonnelPayment {
  id: number; // string'den number'a değiştirildi
  personnelId: number; // string'den number'a değiştirildi
  amount: number;
  date: string;
  customerJobId?: number; // string'den number'a değiştirildi
  payer: Payer;
  paymentMethod: PaymentMethod;
}

export interface SharedExpense {
    id: number; // Backend: GiderId
    description: string; // Backend: Aciklama
    amount: number; // Backend: Tutar
    date: string; // Backend: Tarih
    paymentMethod: PaymentMethod; // Backend: OdemeYontemi
    payer: Payer; // Backend: Odeyen
    status: 'paid' | 'unpaid'; // Backend: Durum
    deletedAt?: string; // Backend: DeletedAt
}

export interface Customer {
  id: number; // string'den number'a değiştirildi
  name: string;
  contactInfo: string;
  address: string;
  jobDescription: string;
}

export type IncomePaymentMethod = 'TRY' | 'USD' | 'EUR' | 'GOLD';
export type GoldType = 'gram' | 'quarter' | 'full';

export interface Material {
    id: string; // Bu ID mock datada string olarak kalmış, backend modeline göre number olabilir, şimdilik string bırakalım.
    name: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
}

export interface JobPersonnelPayment {
    personnelId: number; // string'den number'a değiştirildi
    payment: number;
    daysWorked: number;
    paymentMethod?: PaymentMethod;
}

export interface CustomerJob {
  id: number; // string'den number'a değiştirildi
  customerId: number; // string'den number'a değiştirildi
  location: string;
  description: string;
  date: string;
  income: number;
  incomePaymentMethod?: IncomePaymentMethod;
  incomeGoldType?: GoldType;
  personnelIds: number[]; // string[]'den number[]'a değiştirildi
  personnelPayments: JobPersonnelPayment[];
  materials: Material[];
}

export interface Income {
  id: number; // string'den number'a değiştirildi
  description: string;
  amount: number;
  date: string;
}

export interface Expense {
  id: number; // string'den number'a değiştirildi
  description: string;
  amount: number;
  date: string;
}

export interface DefterEntry {
  id: number; // string'den number'a değiştirildi
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'unpaid';
  dueDate?: string;
  paidDate?: string;
  notes?: string;
}

export type NoteCategory = 'todo' | 'reminder' | 'important';

export interface DefterNote {
  id: number; // string'den number'a değiştirildi
  title: string;
  description?: string;
  category: NoteCategory;
  createdAt: string;
  dueDate?: string;
  completed: boolean;
}

export interface WorkDay {
  id: number; // string'den number'a değiştirildi
  personnelId: number; // string'den number'a değiştirildi
  customerJobId: number; // string'den number'a değiştirildi
  date: string;
  wage: number;
  location?: string;
  jobDescription?: string;
}

export interface PuantajKayitlari {
  kayitId: number;
  personelId: number;
  musteriIsId: number;
  tarih: string;
  gunlukUcret: number;
  konum?: string;
  isTanimi?: string;
}