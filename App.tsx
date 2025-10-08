import React, { useState, useEffect, lazy, Suspense } from 'react';
// mockData importunu siliyoruz, artık veriler API'den gelecek.
import { Role, User, Personnel, PersonnelPayment, Customer, CustomerJob, DefterEntry, DefterNote, WorkDay, SharedExpense } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Bileşenleri lazy load ederek performansı artırıyoruz
const PersonnelView = lazy(() => import('./components/PersonnelView'));
const ReportView = lazy(() => import('./components/ReportView'));
const AdminView = lazy(() => import('./components/AdminView'));
const CustomerView = lazy(() => import('./components/CustomerView'));
const KasaView = lazy(() => import('./components/LedgerView'));
const GlobalSearchView = lazy(() => import('./components/GlobalSearchView'));
const TimeSheetView = lazy(() => import('./components/TimeSheetView'));

type View = 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa' | 'timesheet';

// .NET API'mizin adresini buraya yazıyoruz.
// Port numarasını kendi bilgisayarındakiyle (örn: 5234) değiştirmeyi unutma!
// Vercel proxy kullanarak CORS sorununu çözüyoruz
const API_BASE_URL = '/api/proxy';
// const API_BASE_URL = 'https://is-takip-backend-dxud.onrender.com';

// Debug için API URL'sini konsola yazdır
console.log('API_BASE_URL:', API_BASE_URL); 

// Tekrarlı API istekleri için yardımcı bir fonksiyon
const apiRequest = async (endpoint: string, method: string = 'GET', body: any = null) => {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        // Hata gövdesi JSON ya da düz metin olabilir; ikisini de işle
        let errorMessage = `İstek başarısız: ${response.status}`;
        try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = typeof errorData === 'string' ? errorData : (errorData.message || errorMessage);
            } else {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }
        } catch {}
        throw new Error(errorMessage || 'Sunucudan bir hata alındı.');
    }
    if (response.status === 204) { // 204 No Content (örn: Delete işlemi)
        return null;
    }
    return response.json();
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('customers');
  
  // Başlangıçta tüm state'ler boş bir dizi olarak ayarlanır
  const [users, setUsers] = useState<User[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [personnelPayments, setPersonnelPayments] = useState<PersonnelPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>([]);
  const [defterEntries, setDefterEntries] = useState<DefterEntry[]>([]);
  const [defterNotes, setDefterNotes] = useState<DefterNote[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [navigateToItem, setNavigateToItem] = useState<{ view: View, id: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Başlangıç Verilerini API'den Çekme Fonksiyonu
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/Data/all');
      setUsers(data.users);
      // API -> Frontend model eşlemesi (AdSoyad/NotMetni/NotGuncellenmeTarihi -> name/note)
      const normalizedPersonnel: Personnel[] = (data.personnel || []).map((p: any) => {
        const rawName = (p.AdSoyad ?? p.adSoyad ?? p.name ?? '') as string;
        const name = typeof rawName === 'string' && rawName.trim().toUpperCase() === 'EMPTY'
          ? ''
          : rawName;
        return {
          id: p.PersonelId ?? p.personelId ?? p.id,
          name,
          note: (p.NotMetni != null || p.NotGuncellenmeTarihi != null)
            ? {
                text: p.NotMetni ?? p.notMetni ?? '',
                updatedAt: p.NotGuncellenmeTarihi ?? p.notGuncellenmeTarihi ?? '',
              }
            : p.note,
        } as Personnel;
      });
      setPersonnel(normalizedPersonnel);
      // Customers'ı normalize et (id her zaman number olsun)
      const normalizedCustomers: Customer[] = (data.customers || []).map((c: any) => ({
        id: typeof c.id === 'number' ? c.id : parseInt(String(c.id ?? c.customerId ?? 0), 10),
        name: c.name ?? c.ad ?? '',
        contactInfo: c.contactInfo ?? c.iletisim ?? '',
        address: c.address ?? c.adres ?? '',
        jobDescription: c.jobDescription ?? c.isTanim ?? '',
      }));
      setCustomers(normalizedCustomers);

      // CustomerJobs'u normalize et (id ve customerId number, diziler boş değilse maplansın)
      const normalizedJobsBase: CustomerJob[] = (data.customerJobs || []).map((j: any) => {
        const safeId = typeof j.id === 'number' ? j.id : parseInt(String(j.id ?? j.jobId ?? 0), 10);
        const safeCustomerId = typeof j.customerId === 'number' ? j.customerId : parseInt(String(j.customerId ?? j.musteriId ?? 0), 10);
        const personnelIds: number[] = (j.personnelIds || j.personeller || []).map((pid: any) => (typeof pid === 'number' ? pid : parseInt(String(pid), 10))).filter((n: any) => !Number.isNaN(n));
        const personnelPayments = (j.personnelPayments || j.hakedisler || []).map((p: any) => ({
          personnelId: typeof p.personnelId === 'number' ? p.personnelId : parseInt(String(p.personnelId ?? p.pid ?? 0), 10),
          payment: Number(p.payment ?? p.tutar ?? 0) || 0,
          daysWorked: Number(p.daysWorked ?? p.gun ?? 0) || 0,
          paymentMethod: p.paymentMethod ?? p.odemeYontemi,
        }));
        const materials = (j.materials || j.malzemeler || j.IsMalzemeleri || []).map((m: any) => {
          const mapped = {
            id: String(m.id ?? m.malzemeId ?? m.IsMalzemeId ?? `mat-${safeId}-${Math.random()}`),
            name: m.name ?? m.ad ?? m.MalzemeAdi ?? '',
            unit: m.unit ?? m.birim ?? m.Birim,
            quantity: Number(m.quantity ?? m.adet ?? m.Miktar ?? 0) || 0,
            unitPrice: Number(m.unitPrice ?? m.birimFiyat ?? m.BirimFiyat ?? 0) || 0,
          };
          console.log(`Malzeme okunuyor:`, { original: m, mapped });
          return mapped;
        });
        return {
          id: safeId,
          customerId: safeCustomerId,
          location: j.location ?? j.konum ?? '',
          description: j.description ?? j.aciklama ?? '',
          date: j.date ?? j.tarih ?? '',
          income: Number(j.income ?? j.gelir ?? 0) || 0,
          incomePaymentMethod: j.incomePaymentMethod ?? j.gelirBirimi,
          incomeGoldType: j.incomeGoldType ?? j.altinTuru,
          personnelIds,
          personnelPayments,
          materials,
        } as CustomerJob;
      });

      // Backend toplu uç noktasından gelen iş hakedişlerini (IsHakedisleri) job'lara birleştir
      const earnings = (data.jobEarnings || data.isHakedisleri || []).map((e: any) => ({
        jobId: typeof e.isId === 'number' ? e.isId : parseInt(String(e.isId ?? e.jobId ?? 0), 10),
        personnelId: typeof e.personnelId === 'number' ? e.personnelId : parseInt(String(e.personnelId ?? e.personelId ?? 0), 10),
        payment: Number(e.payment ?? e.hakedisTutari ?? e.hakedis_tutari ?? 0) || 0,
        daysWorked: Number(e.daysWorked ?? e.calisilanGunSayisi ?? 0) || 0,
        paymentMethod: e.paymentMethod ?? e.odemeYontemi ?? undefined,
      }));

      const normalizedJobs = normalizedJobsBase.map((job) => {
        // Eğer backend zaten Include ile personnelPayments getirdiyse, yeniden ekleme ve çifte sayma yapma
        if (job.personnelPayments && job.personnelPayments.length > 0) {
          return job;
        }
        const jobEarnings = earnings.filter((e: any) => e.jobId === job.id);
        if (jobEarnings.length === 0) return job;

        // Merge et ve basit anahtarla duplicate'leri engelle
        const merged = [...(job.personnelPayments || []), ...jobEarnings.map((e: any) => ({
          personnelId: e.personnelId,
          payment: e.payment,
          daysWorked: e.daysWorked,
          paymentMethod: e.paymentMethod,
        }))];
        const uniqMap = new Map<string, any>();
        for (const p of merged) {
          const key = `${p.personnelId}:${p.payment}:${p.daysWorked}:${p.paymentMethod ?? ''}`;
          if (!uniqMap.has(key)) uniqMap.set(key, p);
        }
        const dedupedPayments = Array.from(uniqMap.values());
        const mergedPersonnelIds = Array.from(new Set([...(job.personnelIds || []), ...dedupedPayments.map((p: any) => p.personnelId)]));
        return { ...job, personnelPayments: dedupedPayments, personnelIds: mergedPersonnelIds } as CustomerJob;
      });

      // Personel ID'leri boşsa, hakedişlerden (personnelPayments) türet
      const normalizedJobsWithIds: CustomerJob[] = normalizedJobs.map(j => {
        const existingIds = Array.isArray(j.personnelIds) ? j.personnelIds : [];
        if (existingIds.length > 0) return j;
        const inferredIds = Array.from(new Set((j.personnelPayments || []).map(p => p.personnelId).filter((n: any) => typeof n === 'number')));
        return { ...j, personnelIds: inferredIds } as CustomerJob;
      });
      setCustomerJobs(normalizedJobsWithIds);
      setPersonnelPayments(data.personnelPayments);
      // SharedExpenses veri dönüşümü (Backend: OrtakGiderler -> Frontend: SharedExpense)
      console.log('Backend\'den gelen sharedExpenses sayısı:', data.sharedExpenses?.length);
      console.log('İlk gider:', data.sharedExpenses?.[0]);
      const normalizedSharedExpenses: SharedExpense[] = (data.sharedExpenses || []).map((s: any) => {
        console.log('Gider detayı:', {
          id: s.GiderId ?? s.id,
          description: s.Aciklama ?? s.description ?? s.aciklama ?? '',
          tarih: s.Tarih,
          tarihTipi: typeof s.Tarih,
          tumAlanlar: Object.keys(s)
        });
        
        const normalized = {
          id: s.GiderId ?? s.id,
          description: s.Aciklama ?? s.description ?? s.aciklama ?? '',
          amount: Number(s.Tutar ?? s.amount ?? s.tutar ?? 0) || 0,
          date: (() => {
              const dateValue = s.Tarih ?? s.date;
              if (!dateValue) return new Date().toISOString();
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
          })(),
          paymentMethod: s.OdemeYontemi ?? s.paymentMethod ?? 'cash',
          payer: s.Odeyen ?? s.payer ?? 'Kasa',
          status: s.Durum ?? s.status ?? 'unpaid',
          deletedAt: s.deletedAt ? s.deletedAt : undefined
        };
        return normalized;
      });
      setSharedExpenses(normalizedSharedExpenses);
      setDefterEntries(data.defterEntries);
      setDefterNotes(data.defterNotes);
      setWorkDays(data.workDays);
    } catch (error) {
      console.error("API'den veri çekerken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUserString = localStorage.getItem('currentUser');
    if (savedUserString && savedUserString !== 'undefined' && savedUserString !== 'null') {
      try {
        const user: User = JSON.parse(savedUserString);
        if (user && user.id) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            fetchAllData();
        } else {
            localStorage.removeItem('currentUser');
            setIsLoading(false);
        }
      } catch (error) {
        localStorage.removeItem('currentUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const handleLogin = async (loginRequest: { kullaniciAdi: string, sifre: string }) => {
    try {
      const user = await apiRequest('/api/Kullanicilar/login', 'POST', loginRequest);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      await fetchAllData(); 
      if (user.email === 'baris') setCurrentView('timesheet');
      else setCurrentView('customers');
      return true;
    } catch (error: any) {
      return error.message;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };
  
  const handleNavigation = (view: View, id: number) => {
    setGlobalSearchQuery('');
    if (view === 'kasa') {
        setCurrentView('kasa');
    }
    setNavigateToItem({ view, id });
  };
  
  const handleNavigationComplete = () => {
    setNavigateToItem(null);
  };
  
  // =========================================================================
  // --- TAMAMLANMIŞ CRUD FONKSİYONLARI ---
  // =========================================================================
  
  const addCustomer = async (data: Omit<Customer, 'id'>) => {
    const saved = await apiRequest('/api/Musteriler', 'POST', data);
    setCustomers(prev => [...prev, saved]);
  };
  const updateCustomer = async (data: Customer) => {
    const saved = await apiRequest(`/api/Musteriler/${data.id}`, 'PUT', data);
    // Eğer API updated objeyi döndürüyorsa onu kullan; dönmüyorsa data'yı kullan
    setCustomers(prev => prev.map(c => c.id === data.id ? (saved || data) : c));
  };
  const deleteCustomer = async (id: string) => {
    await apiRequest(`/api/Musteriler/${id}`, 'DELETE');
    await fetchAllData();
  };

  const addCustomerJob = async (data: Omit<CustomerJob, 'id'>) => {
    // Backend'in beklediği alanlara map et (sadece desteklenen kolonlar)
    const body = {
      customerId: data.customerId,
      location: data.location,
      description: data.description,
      // Tarihi tam ISO formatına çevir (backend DateTime için daha uyumlu)
      date: data.date ? new Date(`${data.date}T00:00:00`).toISOString() : new Date().toISOString(),
      income: data.income,
      incomePaymentMethod: data.incomePaymentMethod,
      incomeGoldType: data.incomePaymentMethod === 'GOLD' ? data.incomeGoldType : null,
    } as any;
    const saved = await apiRequest('/api/Musteriler/isler', 'POST', body);
    // Optimistic update: eklenen işi anında listeye yansıt
    setCustomerJobs(prev => [...prev, saved]);
    
    // Hakediş satırlarını gönder
    try {
      const earnings = (data.personnelPayments || []).map(p => ({
        isId: saved.id,
        personnelId: p.personnelId,
        payment: p.payment,
        daysWorked: p.daysWorked,
        paymentMethod: p.paymentMethod,
      }));
      
      if (earnings.length > 0) {
        console.log('Hakediş ekleme deneniyor:', earnings);
        
        try {
          // Backend'in beklediği formata çevir (IsHakedisleri modeli)
          const backendEarnings = earnings.map(e => ({
            PersonelId: e.personnelId,
            HakedisTutari: e.payment,
            CalisilanGunSayisi: e.daysWorked,
            OdemeYontemi: e.paymentMethod
            // IsId backend'de otomatik set edilecek
          }));
          
          console.log('Backend formatında hakediş verisi:', backendEarnings);
          
          // Bulk endpoint'i kullan
          await apiRequest(`/api/Musteriler/isler/${saved.id}/hakedisler/bulk`, 'POST', backendEarnings);
          console.log('✅ Bulk hakediş ekleme başarılı');
        } catch (bulkError) {
          console.warn('Bulk hakediş ekleme başarısız:', bulkError);
          console.error('❌ Hakediş ekleme başarısız:', bulkError);
        }
      }
    } catch (e) {
      console.warn('Hakedişleri gönderirken bir sorun oluştu:', e);
    }
    
    // Malzeme verilerini tek tek gönder (bulk yerine)
    console.log('=== MALZEME DEBUG BAŞLADI ===');
    console.log('Gelen data.materials:', data.materials);
    
    try {
      const allMaterials = data.materials || [];
      console.log('Tüm malzemeler:', allMaterials);
      
      const validMaterials = allMaterials.filter(m => {
        const isValid = m.name && m.name.trim() !== '';
        console.log(`Malzeme "${m.name}" geçerli mi?`, isValid);
        return isValid;
      });
      
      console.log('Filtrelenmiş geçerli malzemeler:', validMaterials);
      
      // Her malzemeyi tek tek ekle
      for (const material of validMaterials) {
        const materialData = {
          IsId: saved.id,
          MalzemeAdi: material.name.trim(),
          Birim: material.unit || null,
          Miktar: parseFloat(material.quantity.toString()) || 0,
          BirimFiyat: parseFloat(material.unitPrice.toString()) || 0,
        };
        
        console.log('Tek malzeme gönderiliyor:', materialData);
        
        try {
          await apiRequest('/api/Musteriler/malzemeler', 'POST', materialData);
          console.log('✅ Malzeme başarıyla eklendi:', materialData.MalzemeAdi);
        } catch (e) {
          console.error('❌ Malzeme eklenirken hata:', materialData.MalzemeAdi, e);
        }
      }
      
      console.log('✅ Tüm malzemeler işlendi!');
    } catch (e) {
      console.error('❌ Malzemeleri işlerken bir sorun oluştu:', e);
    }
    
    console.log('=== MALZEME DEBUG BİTTİ ===');
    
    // Ardından tüm verileri tazele (ID, ilişkiler vs.)
    await fetchAllData();
  };
  const updateCustomerJob = async (data: CustomerJob) => {
    const body = {
      id: data.id,
      customerId: data.customerId,
      location: data.location,
      description: data.description,
      // Backend PostgreSQL 'timestamptz' için UTC ISO bekliyor
      date: data.date
        ? (data.date.includes('T')
            ? new Date(data.date).toISOString()
            : new Date(`${data.date}T00:00:00`).toISOString())
        : new Date().toISOString(),
      income: data.income,
      incomePaymentMethod: data.incomePaymentMethod,
      incomeGoldType: data.incomePaymentMethod === 'GOLD' ? data.incomeGoldType : null,
    } as any;
    const saved = await apiRequest(`/api/Musteriler/isler/${data.id}`, 'PUT', body);
    setCustomerJobs(prev => prev.map(j => j.id === data.id ? (saved || data) : j));
    
    // Hakediş satırlarını güncelle/gönder
    try {
      const earnings = (data.personnelPayments || []).map(p => ({
        isId: data.id,
        personnelId: p.personnelId,
        payment: p.payment,
        daysWorked: p.daysWorked,
        paymentMethod: p.paymentMethod,
      }));
      
      if (earnings.length > 0) {
        console.log('Hakediş güncelleme deneniyor:', earnings);
        
        try {
          // Backend'in beklediği formata çevir (IsHakedisleri modeli)
          const backendEarnings = earnings.map(e => ({
            PersonelId: e.personnelId,
            HakedisTutari: e.payment,
            CalisilanGunSayisi: e.daysWorked,
            OdemeYontemi: e.paymentMethod
            // IsId backend'de otomatik set edilecek
          }));
          
          console.log('Backend formatında hakediş güncelleme verisi:', backendEarnings);
          
          // Bulk endpoint'i kullan
          await apiRequest(`/api/Musteriler/isler/${data.id}/hakedisler/bulk`, 'POST', backendEarnings);
          console.log('✅ Bulk hakediş güncelleme başarılı');
        } catch (bulkError) {
          console.warn('Bulk hakediş güncelleme başarısız:', bulkError);
          console.error('❌ Hakediş güncelleme başarısız:', bulkError);
        }
      }
    } catch (e) {
      console.warn('Hakedişleri gönderirken bir sorun oluştu:', e);
    }
    
    // Malzeme güncelleme işlemi kaldırıldı - sadece yeni iş eklenirken malzemeler eklenir
    // Personel hakediş güncellemelerinde malzemeler tekrar eklenmemeli
    
    await fetchAllData();
  };
  const deleteCustomerJob = async (id: string) => {
    await apiRequest(`/api/Musteriler/isler/${id}`, 'DELETE');
    await fetchAllData();
  };

  // POST /api/Personel
  const addPersonnel = async (data: Omit<Personnel, 'id'>) => {
    // AÇIKLAMA KONTROLÜ EKLEDİM
    if (!data.name || data.name.trim() === '') {
      alert('Personel adı boş bırakılamaz!');
      return; // API çağrısını yapmadan geri dön
    }

    const body = {
      // Backend Personel modeli AdSoyad bekliyor
      AdSoyad: data.name.trim(), // Boşlukları temizle
      NotMetni: data.note?.text ?? null,
      NotGuncellenmeTarihi: data.note?.updatedAt ?? null,
    } as any;
    
    console.log('Personel ekleniyor:', body); // Debug için
    
    const saved = await apiRequest('/api/Personel', 'POST', body);
    
    console.log('Backend\'den gelen veri:', saved); // Debug için
    
    // Dönüşü de normalize et
    const savedRawName = (saved.AdSoyad ?? saved.adSoyad ?? saved.name ?? data.name ?? '') as string;
    const normalized: Personnel = {
      id: saved.PersonelId ?? saved.personelId ?? saved.id,
      name: typeof savedRawName === 'string' && savedRawName.trim().toUpperCase() === 'EMPTY' ? '' : savedRawName,
      note: (saved.NotMetni != null || saved.NotGuncellenmeTarihi != null)
        ? { text: saved.NotMetni ?? '', updatedAt: saved.NotGuncellenmeTarihi ?? '' }
        : data.note,
    };
    
    console.log('Normalize edilen veri:', normalized); // Debug için
    
    setPersonnel(prev => [...prev, normalized]);
    // Güncel liste için tüm verileri yenile
    await fetchAllData();
  };

  // PUT /api/Personel/{id}
  const updatePersonnel = async (data: Personnel) => {
    // AÇIKLAMA KONTROLÜ EKLEDİM
    if (!data.name || data.name.trim() === '') {
      alert('Personel adı boş bırakılamaz!');
      return; // API çağrısını yapmadan geri dön
    }

    const body = {
      AdSoyad: data.name.trim(), // Boşlukları temizle
      NotMetni: data.note?.text ?? null,
      NotGuncellenmeTarihi: data.note ? new Date(data.note.updatedAt).toISOString() : null,
    } as any;
    
    console.log('Personel güncelleniyor:', body); // Debug için
    
    await apiRequest(`/api/Personel/${data.id}`, 'PUT', body);
    await fetchAllData();
  };
  const deletePersonnel = async (id: number) => {
    await apiRequest(`/api/Personel/${id}`, 'DELETE');
    await fetchAllData();
  };

  const addPersonnelPayment = async (data: Omit<PersonnelPayment, 'id'>) => {
    // Backend alanlarına açıkça map et ve tarih formatını ISO yap
    const body = {
      personnelId: data.personnelId,
      amount: data.amount,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      customerJobId: data.customerJobId ?? null,
      payer: data.payer,
      paymentMethod: data.paymentMethod,
    } as any;
    const saved = await apiRequest('/api/Personel/odemeler', 'POST', body);
    setPersonnelPayments(prev => [...prev, saved]);
    // İlgili özetler ve bakiyeler için veriyi yenile
    await fetchAllData();
  };
  const deletePersonnelPayment = async (id: number) => {
    await apiRequest(`/api/Personel/odemeler/${id}`, 'DELETE');
    setPersonnelPayments(prev => prev.filter(p => p.id !== id));
  };
  
  const addUser = async (data: Omit<User, 'id'>) => {
      const saved = await apiRequest('/api/Kullanicilar', 'POST', data);
      setUsers(prev => [...prev, saved]);
  };
  const updateUser = async (data: User) => {
      await apiRequest(`/api/Kullanicilar/${data.id}`, 'PUT', data);
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
  };
  const deleteUser = async (id: string) => {
      await apiRequest(`/api/Kullanicilar/${id}`, 'DELETE');
      setUsers(prev => prev.filter(u => u.id !== id));
  };
  
  const addDefterEntry = async (data: Omit<DefterEntry, 'id'>) => {
      const saved = await apiRequest('/api/Kasa/defterkayitlari', 'POST', data);
      setDefterEntries(prev => [...prev, saved]);
  };
  const updateDefterEntry = async (data: DefterEntry) => {
      await apiRequest(`/api/Kasa/defterkayitlari/${data.id}`, 'PUT', data);
      setDefterEntries(prev => prev.map(e => e.id === data.id ? data : e));
  };
  const deleteDefterEntry = async (id: string) => {
      await apiRequest(`/api/Kasa/defterkayitlari/${id}`, 'DELETE');
      setDefterEntries(prev => prev.filter(e => e.id !== id));
  };

  const addSharedExpense = async (data: Omit<SharedExpense, 'id'>) => {
    if (!data.description || data.description.trim() === '') {
        alert('Açıklama alanı boş bırakılamaz!');
        return;
    }

    try {
        // Frontend → Backend dönüşümü (JsonPropertyName'e göre)
        const payload = {
            description: data.description.trim(),
            amount: parseFloat(data.amount.toString()) || 0,
            date: data.date,
            paymentMethod: data.paymentMethod,
            payer: data.payer,
            status: data.status
        };

         const response = await fetch(`${API_BASE_URL}/Kasa/ortakgiderler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Hatası:', errorText);
            throw new Error('Gider eklenemedi');
        }

        const saved = await response.json();
        
        // Backend → Frontend dönüşümü
        const frontendData: SharedExpense = {
            id: saved.id,
            description: saved.description,
            amount: saved.amount,
            date: saved.date,
            paymentMethod: saved.paymentMethod,
            payer: saved.payer,
            status: saved.status,
            deletedAt: saved.deletedAt
        };
        
        setSharedExpenses(prev => [...prev, frontendData]);
    } catch (error) {
        console.error('Gider ekleme hatası:', error);
        alert('Gider eklenirken bir hata oluştu: ' + error.message);
    }
};

const updateSharedExpense = async (data: SharedExpense) => {
    try {
        const payload = {
            id: data.id,
            description: data.description,
            amount: parseFloat(data.amount.toString()) || 0,
            date: data.date,
            paymentMethod: data.paymentMethod,
            payer: data.payer,
            status: data.status
        };

        const response = await fetch(`${API_BASE_URL}/Kasa/ortakgiderler/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Gider güncellenemedi');
        }

        // Response'un JSON olup olmadığını kontrol et
        const contentType = response.headers.get('content-type');
        let saved;
        
        if (contentType && contentType.includes('application/json')) {
            saved = await response.json();
        } else {
            // JSON değilse, güncellenmiş veriyi kullan
            saved = data;
        }
        
        const updatedData: SharedExpense = {
            id: saved.id || data.id,
            description: saved.description || data.description,
            amount: saved.amount || data.amount,
            date: saved.date || data.date,
            paymentMethod: saved.paymentMethod || data.paymentMethod,
            payer: saved.payer || data.payer,
            status: saved.status || data.status,
            deletedAt: saved.deletedAt || data.deletedAt
        };
        
        setSharedExpenses(prev => prev.map(e => e.id === data.id ? updatedData : e));
    } catch (error) {
        console.error('Gider güncelleme hatası:', error);
        alert('Gider güncellenirken bir hata oluştu');
    }
};

const deleteSharedExpense = async (expenseId: number) => {
    try {
         const response = await fetch(`${API_BASE_URL}/Kasa/ortakgiderler/${expenseId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Gider silinemedi');
        }

        setSharedExpenses(prev => prev.map(e => 
            e.id === expenseId ? { ...e, deletedAt: new Date().toISOString() } : e
        ));
    } catch (error) {
        console.error('Gider silme hatası:', error);
        alert('Gider silinirken bir hata oluştu');
    }
};

const restoreSharedExpense = async (expenseId: number) => {
    try {
         const response = await fetch(`${API_BASE_URL}/Kasa/ortakgiderler/${expenseId}/restore`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Gider geri alınamadı');
        }

        setSharedExpenses(prev => prev.map(e => {
            if (e.id === expenseId) {
                const { deletedAt, ...rest } = e;
                return rest;
            }
            return e;
        }));
    } catch (error) {
        console.error('Gider geri alma hatası:', error);
        alert('Gider geri alınırken bir hata oluştu');
    }
};

const permanentlyDeleteSharedExpense = async (expenseId: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/Kasa/ortakgiderler/${expenseId}/permanent`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Backend'den başarılı yanıt gelirse, frontend'den de kaldır
            setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
            console.log('✅ Gider kalıcı olarak silindi');
        } else {
            // Backend endpoint yoksa sadece frontend'den kaldır
            setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
            console.warn('⚠️ Backend endpoint bulunamadı, sadece frontend\'den kaldırıldı');
        }
    } catch (error) {
        console.error('Kalıcı silme hatası:', error);
        // Hata olsa bile frontend'den kaldır
        setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
        alert('Gider kalıcı olarak silindi (yerel olarak)');
    }
};

  // (Not: Defter Notları ve Ortak Gider Silme/Geri Getirme için de benzer şekilde API endpointleri ve fonksiyonlar eklenebilir)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><LoadingSpinner /></div>;
  }

  if (!isAuthenticated || !currentUser) {
    // LoginView'a artık "users" listesini göndermiyoruz.
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen md:flex">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>
      )}
      <Sidebar currentView={currentView} setCurrentView={(view) => { setGlobalSearchQuery(''); setCurrentView(view); setIsSidebarOpen(false); }} currentUser={currentUser} isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header currentUser={currentUser} onLogout={handleLogout} globalSearchQuery={globalSearchQuery} setGlobalSearchQuery={setGlobalSearchQuery} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 min-w-0">
          <Suspense fallback={<LoadingSpinner />}>
            {globalSearchQuery ? (
              <GlobalSearchView 
                query={globalSearchQuery}
                personnel={personnel}
                customers={customers}
                customerJobs={customerJobs}
                defterEntries={defterEntries}
                sharedExpenses={sharedExpenses}
                onNavigate={handleNavigation}
              />
            ) : (
              <>
                {currentView === 'personnel' && (
                  <PersonnelView
                    currentUser={currentUser}
                    users={users}
                    personnel={personnel}
                    customers={customers}
                    customerJobs={customerJobs}
                    personnelPayments={personnelPayments}
                    onAddPersonnel={addPersonnel}
                    onUpdatePersonnel={updatePersonnel}
                    onDeletePersonnel={deletePersonnel}
                    onAddPersonnelPayment={addPersonnelPayment}
                    onDeletePersonnelPayment={deletePersonnelPayment}
                    navigateToId={navigateToItem?.view === 'personnel' ? navigateToItem.id : null}
                    onNavigationComplete={handleNavigationComplete}
                  />
                )}
                {currentView === 'customers' && (
                  <CustomerView
                      currentUser={currentUser}
                      customers={customers}
                      customerJobs={customerJobs}
                      personnel={personnel}
                      onAddCustomer={addCustomer}
                      onUpdateCustomer={updateCustomer}
                      onDeleteCustomer={deleteCustomer}
                      onAddCustomerJob={addCustomerJob}
                      onUpdateCustomerJob={updateCustomerJob}
                      onDeleteCustomerJob={deleteCustomerJob}
                      navigateToId={navigateToItem?.view === 'customers' ? navigateToItem.id : null}
                      onNavigationComplete={handleNavigationComplete}
                  />
                )}
                {currentView === 'admin' && (
                  <AdminView
                    currentUser={currentUser}
                    users={users}
                    personnel={personnel}
                    onAddUser={addUser}
                    onUpdateUser={updateUser}
                    onDeleteUser={deleteUser}
                  />
                )}
                {currentView === 'kasa' && (
                  <KasaView
                    currentUser={currentUser}
                    customers={customers}
                    customerJobs={customerJobs}
                    personnel={personnel}
                    personnelPayments={personnelPayments}
                    defterEntries={defterEntries}
                    defterNotes={defterNotes}
                    sharedExpenses={sharedExpenses}
                    onAddDefterEntry={addDefterEntry}
                    onUpdateDefterEntry={updateDefterEntry}
                    onDeleteDefterEntry={deleteDefterEntry}
                    onAddSharedExpense={addSharedExpense}
                    onUpdateSharedExpense={updateSharedExpense}
                    onDeleteSharedExpense={deleteSharedExpense}
                    onRestoreSharedExpense={restoreSharedExpense}
                    onPermanentlyDeleteSharedExpense={permanentlyDeleteSharedExpense}
                  />
                )}
                {/* Diğer view'ler... */}
              </>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}