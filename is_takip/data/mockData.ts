import { Role, User, Personnel, PersonnelPayment, Customer, CustomerJob, Income, Expense, DefterEntry, DefterNote, WorkDay, Payer, PaymentMethod, SharedExpense } from '../types';

export const users: User[] = [
  { id: 'user-1', name: 'Ömer Geçer', email: 'omer', password: 'omer1', role: Role.SUPER_ADMIN },
  { id: 'user-2', name: 'Barış Akman', email: 'baris', password: 'baris', role: Role.VIEWER },
];

export const personnel: Personnel[] = [
  { id: 'p-1', name: 'Ali Veli', note: { text: 'Güvenilir ve çalışkan bir personeldir. Özellikle ince işçilikte çok iyidir.', updatedAt: '2024-05-20T14:30:00Z' } },
  { id: 'p-2', name: 'Ayşe Fatma' },
  { id: 'p-3', name: 'Mustafa Demir' },
  { id: 'p-4', name: 'Emine Çelik' },
  { id: 'p-5', name: 'İbrahim Arslan' },
  { id: 'p-6', name: 'Zeynep Doğan' },
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

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const getDateInCurrentMonth = (day: number) => {
    return new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
}

export const personnelPayments: PersonnelPayment[] = [
    { id: 'ppay-1', personnelId: 'p-13', amount: 5000, date: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(), customerJobId: 'job-6', payer: 'Kasa', paymentMethod: 'cash' },
    { id: 'ppay-2', personnelId: 'p-13', amount: 7500, date: new Date(new Date().setDate(today.getDate() - 2)).toISOString(), customerJobId: 'job-6', payer: 'Ömer', paymentMethod: 'transfer' },
    { id: 'ppay-3', personnelId: 'p-14', amount: 11000, date: today.toISOString(), customerJobId: 'job-7', payer: 'Barış', paymentMethod: 'card' },
    { id: 'ppay-4', personnelId: 'p-1', amount: 10000, date: new Date(new Date().setDate(today.getDate() - 5)).toISOString(), customerJobId: 'job-1', payer: 'Kasa', paymentMethod: 'transfer' },
    { id: 'ppay-5', personnelId: 'p-7', amount: 8000, date: new Date(new Date().setDate(today.getDate() - 3)).toISOString(), customerJobId: 'job-1', payer: 'Ömer', paymentMethod: 'cash' },
    { id: 'ppay-6', personnelId: 'p-2', amount: 25000, date: new Date(new Date().setDate(today.getDate() - 2)).toISOString(), customerJobId: 'job-9', payer: 'Kasa', paymentMethod: 'cash' },
];

export const sharedExpenses: SharedExpense[] = [
    { id: 'se-1', description: 'Öğle Yemeği', amount: 850, date: new Date().toISOString(), paymentMethod: 'cash', payer: 'Ömer', status: 'paid' },
    { id: 'se-2', description: 'Nalburiye Malzemesi', amount: 1200, date: new Date(new Date().setDate(today.getDate() - 1)).toISOString(), paymentMethod: 'card', payer: 'Kasa', status: 'paid' },
    { id: 'se-3', description: 'Ulaşım Gideri', amount: 300, date: new Date(new Date().setDate(today.getDate() - 2)).toISOString(), paymentMethod: 'cash', payer: 'Barış', status: 'paid' },
    { id: 'se-4', description: 'Ofis Temizlik Malzemeleri', amount: 450, date: new Date(new Date().setDate(today.getDate() - 4)).toISOString(), paymentMethod: 'transfer', payer: 'Kasa', status: 'paid' },
    { id: 'se-5', description: 'Tedarikçi Avansı', amount: 5000, date: new Date(new Date().setDate(today.getDate() - 5)).toISOString(), paymentMethod: 'transfer', payer: 'Ömer', status: 'unpaid' },
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
  {
    id: 'cust-3',
    name: 'Mega Marketler Zinciri',
    contactInfo: '0212 555 0000 - satin_alma@megamarket.com',
    address: 'Maslak Mah. Büyükdere Cad. No:25, Sarıyer/İstanbul',
    jobDescription: 'Yeni açılacak şubelerin raf ve stant montaj işleri.',
  },
];

export const customerJobs: CustomerJob[] = [
    // Jobs for ABC İnşaat
    { 
        id: 'job-1', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', description: 'Dış Cephe Mantolama', date: '2024-05-10', income: 1200000, 
        incomePaymentMethod: 'TRY',
        personnelIds: ['p-1', 'p-2', 'p-7'],
        personnelPayments: [
            {personnelId: 'p-1', payment: 45000, paymentMethod: 'transfer', daysWorked: 30}, 
            {personnelId: 'p-2', payment: 48000, paymentMethod: 'cash', daysWorked: 30}, 
            {personnelId: 'p-7', payment: 42000, paymentMethod: 'cash', daysWorked: 28}
        ],
        materials: [
            {id: 'mat-1', name: 'Strafor', unit: 'm²', quantity: 1250, unitPrice: 300},
            {id: 'mat-2', name: 'Sıva Harcı', unit: 'torba', quantity: 200, unitPrice: 150},
        ],
    },
    { 
        id: 'job-2', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', description: 'İç Cephe Alçıpan', date: '2024-05-15', income: 400000,
        incomePaymentMethod: 'USD',
        personnelIds: ['p-3', 'p-4'],
        personnelPayments: [
            {personnelId: 'p-3', payment: 25000, paymentMethod: 'transfer', daysWorked: 20}, 
            {personnelId: 'p-4', payment: 25000, paymentMethod: 'cash', daysWorked: 20}
        ],
        materials: [{id: 'mat-3', name: 'Alçıpan Levha', unit: 'adet', quantity: 250, unitPrice: 300}],
    },
    { 
        id: 'job-3', customerId: 'cust-1', location: 'İstanbul Depo İnşaatı', description: 'Zemin Şap Betonu', date: '2024-05-20', income: 10, 
        incomePaymentMethod: 'GOLD',
        incomeGoldType: 'full',
        personnelIds: ['p-8', 'p-9', 'p-10'],
        personnelPayments: [
            {personnelId: 'p-8', payment: 25000, daysWorked: 15}, 
            {personnelId: 'p-9', payment: 25000, daysWorked: 15}, 
            {personnelId: 'p-10', payment: 20000, daysWorked: 12}
        ],
        materials: [{id: 'mat-4', name: 'Hazır Beton', unit: 'm³', quantity: 150, unitPrice: 1500}],
    },
    { 
        id: 'job-4', customerId: 'cust-1', location: 'Ankara Merkez Plaza Projesi', description: 'Seramik Döşeme', date: '2024-06-01', income: 250000,
        personnelIds: ['p-5', 'p-6'],
        personnelPayments: [
            {personnelId: 'p-5', payment: 22500, daysWorked: 18}, 
            {personnelId: 'p-6', payment: 22500, daysWorked: 18}
        ],
        materials: [{id: 'mat-5', name: 'Seramik', quantity: 400, unitPrice: 150}],
    },
    { 
        id: 'job-8', customerId: 'cust-1', location: 'İstanbul Depo İnşaatı', description: 'Elektrik Tesisatı', date: '2024-06-05', income: 180000,
        personnelIds: ['p-11', 'p-12'],
        personnelPayments: [
            {personnelId: 'p-11', payment: 25000, daysWorked: 14}, 
            {personnelId: 'p-12', payment: 25000, daysWorked: 14}
        ],
        materials: [{id: 'mat-6', name: 'Kablo ve Tesisat Malzemeleri', quantity: 1, unitPrice: 20000}],
    },
    
    // Jobs for Yıldız Konutları
    { 
        id: 'job-5', customerId: 'cust-2', location: 'Site Ortak Alanlar', description: 'Bahçe Duvarı İnşaatı', date: '2024-06-02', income: 350000, 
        personnelIds: ['p-1', 'p-3', 'p-5', 'p-7'],
        personnelPayments: [
            {personnelId: 'p-1', payment: 22000, daysWorked: 15}, 
            {personnelId: 'p-3', payment: 23000, daysWorked: 16}, 
            {personnelId: 'p-5', payment: 22000, daysWorked: 15}, 
            {personnelId: 'p-7', payment: 23000, daysWorked: 16}
        ],
        materials: [{id: 'mat-7', name: 'Tuğla', quantity: 5000, unitPrice: 15}],
    },
    { 
        id: 'job-6', customerId: 'cust-2', location: 'A Blok Tadilat', description: 'Kamelya Montajı', date: '2024-06-05', income: 150000, 
        personnelIds: ['p-13'],
        personnelPayments: [{personnelId: 'p-13', payment: 20000, daysWorked: 10}],
        materials: [{id: 'mat-8', name: 'Ahşap Kamelya Seti', quantity: 8, unitPrice: 3500}],
    },
    { 
        id: 'job-7', customerId: 'cust-2', location: 'Site Ortak Alanlar', description: 'Peyzaj Sulama Sistemi', date: '2024-06-10', income: 100000, 
        personnelIds: ['p-14', 'p-8'],
        personnelPayments: [
            {personnelId: 'p-14', payment: 11000, daysWorked: 8}, 
            {personnelId: 'p-8', payment: 11000, daysWorked: 8}
        ],
        materials: [{id: 'mat-9', name: 'Sulama Sistemi Malzemeleri', quantity: 1, unitPrice: 25000}],
    },
    { 
        id: 'job-9', customerId: 'cust-2', location: 'A Blok Tadilat', description: 'Çatı İzolasyonu', date: '2024-06-12', income: 280000, 
        personnelIds: ['p-2', 'p-4', 'p-6'],
        personnelPayments: [
            {personnelId: 'p-2', payment: 25000, daysWorked: 12}, 
            {personnelId: 'p-4', payment: 25000, daysWorked: 12}, 
            {personnelId: 'p-6', payment: 25000, daysWorked: 12}
        ],
        materials: [{id: 'mat-10', name: 'İzolasyon Malzemesi', quantity: 550, unitPrice: 120}],
    },
    // --- NEW MOCK DATA FOR REPORTS ---
    { 
        id: 'job-10', customerId: 'cust-1', location: 'İzmir Konut Projesi', description: 'Çatı ve Su Yalıtımı', date: '2024-04-15', income: 500000, 
        incomePaymentMethod: 'TRY',
        personnelIds: ['p-1', 'p-8', 'p-9'],
        personnelPayments: [
            {personnelId: 'p-1', payment: 30000, daysWorked: 20}, 
            {personnelId: 'p-8', payment: 32000, daysWorked: 21}, 
            {personnelId: 'p-9', payment: 31000, daysWorked: 20}
        ],
        materials: [
            {id: 'mat-11', name: 'Membran', unit: 'm²', quantity: 800, unitPrice: 200},
            {id: 'mat-12', name: 'İzolasyon Malzemesi', unit: 'paket', quantity: 100, unitPrice: 400},
        ],
    },
    { 
        id: 'job-11', customerId: 'cust-3', location: 'Bursa Şubesi', description: 'Acil Raf Sistemi Montajı (Zarar)', date: '2024-03-20', income: 80000, 
        incomePaymentMethod: 'TRY',
        personnelIds: ['p-13', 'p-14'],
        personnelPayments: [
            {personnelId: 'p-13', payment: 15000, daysWorked: 5}, 
            {personnelId: 'p-14', payment: 15000, daysWorked: 5}
        ],
        materials: [
            {id: 'mat-13', name: 'Özel Raf Sistemi', unit: 'adet', quantity: 1, unitPrice: 60000},
        ],
    },
    { 
        id: 'job-12', customerId: 'cust-3', location: 'Eskişehir Şubesi', description: 'Zemin Epoksi Kaplama', date: '2024-02-10', income: 250000, 
        incomePaymentMethod: 'TRY',
        personnelIds: ['p-5', 'p-6', 'p-11'],
        personnelPayments: [
            {personnelId: 'p-5', payment: 20000, daysWorked: 14}, 
            {personnelId: 'p-6', payment: 20000, daysWorked: 14}, 
            {personnelId: 'p-11', payment: 21000, daysWorked: 15}
        ],
        materials: [
            {id: 'mat-14', name: 'Epoksi Reçine ve Sertleştirici', unit: 'set', quantity: 50, unitPrice: 3000},
        ],
    },
    { 
        id: 'job-13', customerId: 'cust-2', location: 'Site Güvenlik Kulübesi', description: 'Güvenlik Kulübesi İnşaatı (Geçen Yıl)', date: '2023-11-15', income: 120000, 
        incomePaymentMethod: 'TRY',
        personnelIds: ['p-1', 'p-7'],
        personnelPayments: [
            {personnelId: 'p-1', payment: 18000, daysWorked: 10}, 
            {personnelId: 'p-7', payment: 18000, daysWorked: 10}
        ],
        materials: [
            {id: 'mat-15', name: 'Prefabrik Güvenlik Kabini', unit: 'adet', quantity: 1, unitPrice: 60000},
        ],
    },
];

const generateInitialWorkDays = (): WorkDay[] => {
    const workDays: WorkDay[] = [];
    let workDayIdCounter = 1;

    customerJobs.forEach(job => {
        // By parsing the date string manually, we avoid timezone issues.
        // new Date('YYYY-MM-DD') can be interpreted as UTC midnight, which might be the previous day.
        const [startYear, startMonth, startDay] = job.date.split('-').map(Number);
        
        job.personnelPayments.forEach(pPayment => {
            const numDays = pPayment.daysWorked;
            if (!numDays || numDays <= 0) return;

            const dailyWage = pPayment.payment > 0 && numDays > 0 ? Math.round(pPayment.payment / numDays) : 0;

            for (let i = 0; i < numDays; i++) {
                // Create date in local timezone to avoid UTC shifts
                const workDate = new Date(startYear, startMonth - 1, startDay);
                workDate.setDate(workDate.getDate() + i);
                
                // Format date back to YYYY-MM-DD string
                const year = workDate.getFullYear();
                const month = (workDate.getMonth() + 1).toString().padStart(2, '0');
                const day = workDate.getDate().toString().padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                workDays.push({
                    id: `wd-${workDayIdCounter++}`,
                    personnelId: pPayment.personnelId,
                    customerJobId: job.id,
                    date: dateString,
                    wage: dailyWage,
                });
            }
        });
    });

    return workDays;
};

export const workDays: WorkDay[] = generateInitialWorkDays();

export const extraIncomes: Income[] = [
    { id: 'inc-1', description: 'Hurda Malzeme Satışı', amount: 2500, date: new Date().toISOString() }
];

export const extraExpenses: Expense[] = [
    { id: 'exp-1', description: 'Ofis Kira Ödemesi', amount: 10000, date: new Date().toISOString() },
    { id: 'exp-2', description: 'Şantiye Malzeme Alımı', amount: 45000, date: new Date(new Date().setDate(today.getDate() - 3)).toISOString() }
];

export const defterEntries: DefterEntry[] = [
  { id: 'le-1', date: getDateInCurrentMonth(2), description: 'Ziya Geçer - Cam Ödemesi', amount: 1400, type: 'income', dueDate: getDateInCurrentMonth(15), status: 'unpaid', notes: 'Ayın 15inde ödenecek' },
  { id: 'le-2', date: getDateInCurrentMonth(3), description: 'Paşa - Hakediş Alınacak', amount: 900, type: 'income', dueDate: getDateInCurrentMonth(22), status: 'unpaid', notes: 'Hesabından Düşülecek' },
  { id: 'le-3', date: getDateInCurrentMonth(5), description: 'Nalburiye Gideri', amount: 450, type: 'expense', status: 'paid', paidDate: getDateInCurrentMonth(5), notes: 'Nakit ödendi' },
  { id: 'le-4', date: getDateInCurrentMonth(1), description: 'Mahmut Akman - Borç Verildi', amount: 10000, type: 'expense', dueDate: getDateInCurrentMonth(28), status: 'unpaid' },
  { id: 'le-5', date: getDateInCurrentMonth(7), description: 'Ofis Giderleri - Fatura', amount: 320, type: 'expense', dueDate: getDateInCurrentMonth(20), status: 'unpaid', notes: 'Elektrik faturası' },
  { id: 'le-6', date: new Date(new Date().setDate(today.getDate() - 35)).toISOString().split('T')[0], description: 'Geçen Aydan Devir - ABC İnşaat', amount: 5500, type: 'income', status: 'unpaid' },
  { id: 'le-7', date: getDateInCurrentMonth(4), description: 'Yakıt Gideri', amount: 1200, type: 'expense', status: 'paid', paidDate: getDateInCurrentMonth(4) },
];

export const defterNotes: DefterNote[] = [
    { id: 'dn-1', title: 'Malzeme listesini kontrol et', description: 'Ay sonu için gerekli malzemelerin tam listesini çıkar ve siparişleri hazırla.', category: 'todo', createdAt: new Date(new Date().setDate(today.getDate() + 2)).toISOString(), dueDate: new Date(new Date().setDate(today.getDate() + 5)).toISOString().split('T')[0], completed: false },
    { id: 'dn-2', title: 'Yeni proje için müşteriyle görüş', description: 'Yıldız Konutları projesinin detayları için müşteri temsilcisiyle bir toplantı ayarla.', category: 'important', createdAt: new Date().toISOString(), dueDate: new Date(new Date().setDate(today.getDate() + 1)).toISOString().split('T')[0], completed: false },
    { id: 'dn-3', title: 'Vergi ödemesini yap', description: 'KDV beyannamesi ve ödemesi yapılacak.', category: 'todo', createdAt: new Date(new Date().setDate(today.getDate() - 1)).toISOString(), completed: true },
    { id: 'dn-4', title: 'Ekipman bakımı', description: 'Şantiyedeki ekskavatörün periyodik bakımını yaptır.', category: 'reminder', createdAt: new Date(new Date().setDate(today.getDate() - 5)).toISOString(), completed: false },
];