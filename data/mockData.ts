import { Role, User, Personnel, WorkDay, Payment, Income, Expense, PersonnelPayment } from '../types';

export const users: User[] = [
  { id: 'user-1', name: 'Ahmet Yılmaz', email: 'admin@example.com', password: 'password123', role: Role.ADMIN },
  { id: 'user-2', name: 'Mehmet Öztürk', email: 'mehmet@example.com', password: 'password123', role: Role.FOREMAN },
  { id: 'user-3', name: 'Hasan Kaya', email: 'hasan@example.com', password: 'password123', role: Role.FOREMAN },
];

export const personnel: Personnel[] = [
  { id: 'p-1', name: 'Ali Veli', foremanId: 'user-2' },
  { id: 'p-2', name: 'Ayşe Fatma', foremanId: 'user-2' },
  { id: 'p-3', name: 'Mustafa Demir', foremanId: 'user-2' },
  { id: 'p-4', name: 'Emine Çelik', foremanId: 'user-2' },
  { id: 'p-5', name: 'İbrahim Arslan', foremanId: 'user-2' },
  { id: 'p-6', name: 'Zeynep Doğan', foremanId: 'user-2' },
  
  { id: 'p-7', name: 'Hüseyin Kurt', foremanId: 'user-3' },
  { id: 'p-8', name: 'Elif Şahin', foremanId: 'user-3' },
  { id: 'p-9', name: 'Murat Yıldız', foremanId: 'user-3' },
  { id: 'p-10', name: 'Hatice Özer', foremanId: 'user-3' },
  { id: 'p-11', name: 'Yusuf Aksoy', foremanId: 'user-3' },
  { id: 'p-12', name: 'Sultan Aydın', foremanId: 'user-3' },

  { id: 'p-13', name: 'Serkan Can', foremanId: 'user-1' },
  { id: 'p-14', name: 'Derya Deniz', foremanId: 'user-1' },
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
                });
            }
        }
    });
    return workDays;
};

export const workDays: WorkDay[] = generateInitialWorkDays();

const today = new Date();

export const payments: Payment[] = [
    { id: 'pay-1', foremanId: 'user-2', amount: 50000, date: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'pay-2', foremanId: 'user-3', amount: 45000, date: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString() },
];

export const personnelPayments: PersonnelPayment[] = [
    { id: 'ppay-1', personnelId: 'p-13', amount: 5000, date: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'ppay-2', personnelId: 'p-13', amount: 7500, date: new Date(new Date().setDate(today.getDate() - 2)).toISOString() },
    { id: 'ppay-3', personnelId: 'p-14', amount: 15000, date: today.toISOString() },
    { id: 'ppay-4', personnelId: 'p-1', amount: 10000, date: new Date(new Date().setDate(today.getDate() - 5)).toISOString() },
    { id: 'ppay-5', personnelId: 'p-7', amount: 8000, date: new Date(new Date().setDate(today.getDate() - 3)).toISOString() },
];

export const extraIncomes: Income[] = [
    { id: 'inc-1', description: 'Proje Dışı Danışmanlık', amount: 25000, date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'inc-2', description: 'Hurda Malzeme Satışı', amount: 7500, date: today.toISOString() },
];

export const extraExpenses: Expense[] = [
    { id: 'exp-1', description: 'Ofis Kirası', amount: 15000, date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString() },
    { id: 'exp-2', description: 'Malzeme Alımı - Çimento', amount: 35000, date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'exp-3', description: 'Nakliye Ücreti', amount: 4500, date: today.toISOString() },
];