

import { Role, User, Personnel, WorkDay, PersonnelPayment, Customer, CustomerJob, Payment, Income, Expense } from '../types';

export const users: User[] = [
  { id: 'user-1', name: 'Ahmet Yılmaz', email: 'admin@example.com', password: 'password123', role: Role.ADMIN },
  // FIX: Add a foreman user to support foreman-related functionality and login.
  { id: 'user-2', name: 'Mehmet Kaya', email: 'mehmet@example.com', password: 'password123', role: Role.FOREMAN },
];

export const personnel: Personnel[] = [
  // FIX: Assign a foreman to some personnel to demonstrate foreman-specific views.
  { id: 'p-1', name: 'Ali Veli', foremanId: 'user-2' },
  { id: 'p-2', name: 'Ayşe Fatma', foremanId: 'user-2' },
  { id: 'p-3', name: 'Mustafa Demir', foremanId: 'user-2' },
  { id: 'p-4', name: 'Emine Çelik', foremanId: 'user-2' },
  { id: 'p-5', name: 'İbrahim Arslan', foremanId: 'user-2' },
  { id: 'p-6', name: 'Zeynep Doğan', foremanId: 'user-2' },
  { id: 'p-7', name: 'Hüseyin Kurt' },
  { id: 'p-8', name: 'Elif Şahin' },
  { id: 'p-9', name: 'Murat Yıldız' },
  { id: 'p-10', name: 'Hatice Özer' },
  { id: 'p-11', name: 'Yusuf Aksoy' },
  { id: 'p-12', name: 'Sultan Aydın' },
  { id: 'p-13', name: 'Serkan Can' },
  { id: 'p-14', name: 'Derya Deniz' },
];

const locations = ["Merkez Şantiye", "Ankara Projesi", "İstanbul Depo", "İzmir Ofis", "Bursa Fabrika"];
const jobDescriptions = ["İnce işçilik", "Kaba inşaat", "Malzeme taşıma", "Montaj", "Temizlik", "Sıva işleri"];

const generateInitialWorkDays = (): WorkDay[] => {
    const workDays: WorkDay[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    personnel.forEach(p => {
        const workDayCount = Math.floor(Math.random() * 22) + 5; // 5 to 26 work days
        for(let i = 0; i < workDayCount; i++) {
            const day = Math.floor(Math.random() * 28) + 1; // 1 to 28
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const uniqueId = `${p.id}-${dateString}`;
            
            if (!workDays.some(wd => wd.id === uniqueId)) {
                workDays.push({
                    id: uniqueId,
                    personnelId: p.id,
                    date: dateString,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    jobDescription: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)],
                    wage: Math.floor(Math.random() * 501) + 1000, // Random wage between 1000 and 1500
                    hours: Math.floor(Math.random() * 5) + 8, // Random hours between 8 and 12
                });
            }
        }
    });
    return workDays;
};

export const workDays: WorkDay[] = generateInitialWorkDays();

const today = new Date();

// FIX: Add mock data for foreman payments.
export const payments: Payment[] = [
    { id: 'pay-1', foremanId: 'user-2', amount: 15000, date: new Date(new Date().setDate(today.getDate() - 4)).toISOString() },
    { id: 'pay-2', foremanId: 'user-2', amount: 20000, date: new Date(new Date().setDate(today.getDate() - 10)).toISOString() },
];

export const personnelPayments: PersonnelPayment[] = [
    { id: 'ppay-1', personnelId: 'p-13', amount: 5000, date: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'ppay-2', personnelId: 'p-13', amount: 7500, date: new Date(new Date().setDate(today.getDate() - 2)).toISOString() },
    { id: 'ppay-3', personnelId: 'p-14', amount: 15000, date: today.toISOString() },
    { id: 'ppay-4', personnelId: 'p-1', amount: 10000, date: new Date(new Date().setDate(today.getDate() - 5)).toISOString() },
    { id: 'ppay-5', personnelId: 'p-7', amount: 8000, date: new Date(new Date().setDate(today.getDate() - 3)).toISOString() },
];

export const customers: Customer[] = [
  {
    id: 'cust-1',
    name: 'ABC İnşaat A.Ş.',
    contactInfo: '0555 123 4567 - info@abcinsaat.com',
    address: 'Kızılay Mah. Atatürk Blv. No:1, Çankaya/Ankara',
    jobDescription: 'Ankara Merkez Plaza dış cephe ve ince işçilik işleri.',
  },
  {
    id: 'cust-2',
    name: 'Yıldız Konutları Sitesi',
    contactInfo: '0312 987 6543 - yonetim@yildizkonutlari.net',
    address: 'Çayyolu Mah. 8765. Sk. No:2, Çankaya/Ankara',
    jobDescription: 'Site ortak alanlarının tadilatı ve peyzaj düzenlemesi.',
  },
];

export const customerJobs: CustomerJob[] = [
    // Jobs for ABC İnşaat
    { 
        id: 'job-1', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', operation: 'Dış Cephe Mantolama', date: '2024-05-10', quantity: 1250, unit: 'm²', unitPrice: 900, income: 1200000, 
        personnelIds: ['p-1', 'p-2', 'p-7'],
        personnelPayments: [{personnelId: 'p-1', payment: 120000}, {personnelId: 'p-2', payment: 125000}, {personnelId: 'p-7', payment: 105000}],
        materials: [
            {id: 'mat-1', name: 'Strafor', quantity: 1250, unitPrice: 300},
            {id: 'mat-2', name: 'Sıva Harcı', quantity: 200, unitPrice: 150},
        ],
        otherExpenses: 15000,
    },
    { 
        id: 'job-2', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', operation: 'İç Cephe Alçıpan', date: '2024-05-15', quantity: 750, unit: 'm²', unitPrice: 500, income: 400000,
        personnelIds: ['p-3', 'p-4'],
        personnelPayments: [{personnelId: 'p-3', payment: 50000}, {personnelId: 'p-4', payment: 50000}],
        materials: [{id: 'mat-3', name: 'Alçıpan Levha', quantity: 250, unitPrice: 300}],
        otherExpenses: 35000,
    },
    { 
        id: 'job-3', customerId: 'cust-1', location: 'İstanbul Depo İnşaatı', operation: 'Zemin Şap Betonu', date: '2024-05-20', quantity: 150, unit: 'm³', unitPrice: 3800, income: 600000, 
        personnelIds: ['p-8', 'p-9', 'p-10'],
        personnelPayments: [{personnelId: 'p-8', payment: 25000}, {personnelId: 'p-9', payment: 25000}, {personnelId: 'p-10', payment: 20000}],
        materials: [{id: 'mat-4', name: 'Hazır Beton', quantity: 150, unitPrice: 1500}],
        otherExpenses: 25000,
    },
    { 
        id: 'job-4', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', operation: 'Seramik Döşeme', date: '2024-06-01', quantity: 400, unit: 'm²', unitPrice: 600, income: 250000,
        personnelIds: ['p-5', 'p-6'],
        personnelPayments: [{personnelId: 'p-5', payment: 22500}, {personnelId: 'p-6', payment: 22500}],
        materials: [{id: 'mat-5', name: 'Seramik', quantity: 400, unitPrice: 150}],
        otherExpenses: 15000,
    },
    { 
        id: 'job-8', customerId: 'cust-1', location: 'İstanbul Depo İnşaatı', operation: 'Elektrik Tesisatı', date: '2024-06-05', quantity: 1, unit: 'proje', unitPrice: 150000, income: 180000,
        personnelIds: ['p-11', 'p-12'],
        personnelPayments: [{personnelId: 'p-11', payment: 25000}, {personnelId: 'p-12', payment: 25000}],
        materials: [{id: 'mat-6', name: 'Kablo ve Tesisat Malzemeleri', quantity: 1, unitPrice: 20000}],
        otherExpenses: 15000,
    },
    
    // Jobs for Yıldız Konutları
    { 
        id: 'job-5', customerId: 'cust-2', location: 'Site Ortak Alanlar', operation: 'Bahçe Duvarı İnşaatı', date: '2024-06-02', quantity: 300, unit: 'm²', unitPrice: 1100, income: 350000, 
        personnelIds: ['p-1', 'p-3', 'p-5', 'p-7'],
        personnelPayments: [{personnelId: 'p-1', payment: 22000}, {personnelId: 'p-3', payment: 23000}, {personnelId: 'p-5', payment: 22000}, {personnelId: 'p-7', payment: 23000}],
        materials: [{id: 'mat-7', name: 'Tuğla', quantity: 5000, unitPrice: 15}],
        otherExpenses: 35000,
    },
    { 
        id: 'job-6', customerId: 'cust-2', location: 'A Blok Tadilat', operation: 'Kamelya Montajı', date: '2024-06-05', quantity: 8, unit: 'adet', unitPrice: 18000, income: 150000, 
        personnelIds: ['p-13'],
        personnelPayments: [{personnelId: 'p-13', payment: 20000}],
        materials: [{id: 'mat-8', name: 'Ahşap Kamelya Seti', quantity: 8, unitPrice: 3500}],
        otherExpenses: 12000,
    },
    { 
        id: 'job-7', customerId: 'cust-2', location: 'Site Ortak Alanlar', operation: 'Peyzaj Sulama Sistemi', date: '2024-06-10', quantity: 1, unit: 'sistem', unitPrice: 95000, income: 100000, 
        personnelIds: ['p-14', 'p-8'],
        personnelPayments: [{personnelId: 'p-14', payment: 11000}, {personnelId: 'p-8', payment: 11000}],
        materials: [{id: 'mat-9', name: 'Sulama Sistemi Malzemeleri', quantity: 1, unitPrice: 25000}],
        otherExpenses: 8000,
    },
    { 
        id: 'job-9', customerId: 'cust-2', location: 'A Blok Tadilat', operation: 'Çatı İzolasyonu', date: '2024-06-12', quantity: 550, unit: 'm²', unitPrice: 450, income: 280000, 
        personnelIds: ['p-2', 'p-4', 'p-6'],
        personnelPayments: [{personnelId: 'p-2', payment: 25000}, {personnelId: 'p-4', payment: 25000}, {personnelId: 'p-6', payment: 25000}],
        materials: [{id: 'mat-10', name: 'İzolasyon Malzemesi', quantity: 550, unitPrice: 120}],
        otherExpenses: 24000,
    },
];


export const extraIncomes: Income[] = [
    { id: 'inc-1', description: 'Hurda Malzeme Satışı', amount: 2500, date: new Date().toISOString() }
];

export const extraExpenses: Expense[] = [
    { id: 'exp-1', description: 'Ofis Kira Ödemesi', amount: 10000, date: new Date().toISOString() },
    { id: 'exp-2', description: 'Şantiye Malzeme Alımı', amount: 45000, date: new Date(new Date().setDate(today.getDate() - 3)).toISOString() }
];