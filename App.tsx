import React, { useState, useEffect, lazy, Suspense } from 'react';
// mockData importunu siliyoruz, artık veriler API'den gelecek.
import { Role, User, Personnel, PersonnelPayment, Customer, CustomerJob, DefterEntry, DefterNote, WorkDay, SharedExpense, PuantajKayitlari } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Bileşenleri lazy load ederek performansı artırıyoruz
const PersonnelView = lazy(() => import('./components/PersonnelView'));
const PuantajView = lazy(() => import('./components/PuantajView'));
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

// :1 sorununu önlemek için cache temizleme
const clearApiCache = () => {
    try {
        // Service Worker cache temizleme
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            }).catch(() => {}); // Hata durumunda sessizce geç
        }
        
        // Local storage temizleme (sadece API cache'i)
        Object.keys(localStorage).forEach(key => {
            if (key.includes('api') || key.includes('cache')) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    // Hata durumunda sessizce geç
                }
            }
        });
    } catch (e) {
        // Genel hata durumunda sessizce geç
    }
};

// Sayfa yüklendiğinde cache temizle (sadece bir kez)
if (typeof window !== 'undefined') {
    window.addEventListener('load', clearApiCache, { once: true });
}


// Tekrarlı API istekleri için yardımcı bir fonksiyon
const apiRequest = async (endpoint: string, method: string = 'GET', body: any = null, retries: number = 2) => {
    // :1 sorununu önleme - daha agresif temizleme
    let cleanEndpoint = endpoint;
    const originalEndpoint = endpoint;
    cleanEndpoint = endpoint.replace(/:1$/g, '').replace(/:1\//g, '/').replace(/\/:1/g, '');
    
    if (originalEndpoint !== cleanEndpoint) {
        console.log('⚠️ Frontend :1 sorunu tespit edildi ve düzeltildi:', {
            originalEndpoint,
            cleanedEndpoint: cleanEndpoint,
            changes: originalEndpoint !== cleanEndpoint
        });
    }
    
    const options: RequestInit = {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const finalUrl = `${API_BASE_URL}${cleanEndpoint}`;
    
    // Debug için URL'yi kontrol et
    if (endpoint.includes(':1')) {
        console.log('⚠️ :1 sorunu frontend\'de tespit edildi:', {
            originalEndpoint: endpoint,
            cleanedEndpoint: cleanEndpoint,
            finalUrl: finalUrl
        });
    }
    
    // Retry mekanizması - özellikle PUT/PATCH işlemleri için
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            console.log(`🔄 API İsteği (Deneme ${attempt}/${retries + 1}):`, {
                method,
                endpoint: cleanEndpoint,
                finalUrl
            });
            
            const response = await fetch(finalUrl, options);
            
            if (!response.ok) {
                // 504 veya 503 hatası ise retry yap
                if ((response.status === 504 || response.status === 503) && attempt <= retries) {
                    console.warn(`⚠️ ${response.status} hatası, ${attempt + 1}. deneme yapılıyor...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 2s, 4s, 6s bekletme
                    continue;
                }
                
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
            
        } catch (error) {
            // Son deneme ise hatayı fırlat
            if (attempt === retries + 1) {
                throw error;
            }
            
            // 504/503 veya timeout hatası ise retry yap
            if ((error.message.includes('504') || error.message.includes('503') || 
                 error.message.includes('timeout') || error.message.includes('TimeoutError')) && 
                attempt <= retries) {
                console.warn(`⚠️ ${error.message}, ${attempt + 1}. deneme yapılıyor...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 2s, 4s, 6s bekletme
                continue;
            }
            
            // Diğer hatalar için direkt fırlat
            throw error;
        }
    }
    
    // Bu noktaya asla gelmemeli ama TypeScript için
    throw new Error('Beklenmeyen hata');
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentView') as View | null;
      if (saved && ['personnel','reports','admin','customers','kasa','timesheet'].includes(saved)) {
        return saved;
      }
    }
    return 'customers';
  });
  
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
  const [puantajKayitlari, setPuantajKayitlari] = useState<PuantajKayitlari[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [navigateToItem, setNavigateToItem] = useState<{ view: View, id: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const persistCurrentView = (view: View) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentView', view);
    }
  };

  const handleSidebarViewChange = (view: View) => {
    setGlobalSearchQuery('');
    persistCurrentView(view);
    setIsSidebarOpen(false);
  };

  // Başlangıç Verilerini API'den Çekme Fonksiyonu
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/Data/all');
      console.log('🔍 Backend\'den gelen tüm veri:', data);
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
        console.log('🔍 Job verisi:', j);
        console.log('🔍 Job IsHakedisleri:', j.IsHakedisleri);
        
        const safeId = typeof j.id === 'number' ? j.id : parseInt(String(j.id ?? j.jobId ?? 0), 10);
        const safeCustomerId = typeof j.customerId === 'number' ? j.customerId : parseInt(String(j.customerId ?? j.musteriId ?? 0), 10);
        
        // PersonnelIds ve PersonnelPayments'ı önce boş olarak başlat
        // Earnings henüz tanımlanmadığı için burada kullanamayız
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

      // Backend'den gelen tüm job'lardan hakediş verilerini topla
      console.log('Backend\'den gelen customerJobs:', data.customerJobs);
      
      // Her job'dan personnelPayments (IsHakedisleri) verilerini topla
      const allEarnings: any[] = [];
      (data.customerJobs || []).forEach((job: any) => {
        if (job.personnelPayments && Array.isArray(job.personnelPayments)) {
          job.personnelPayments.forEach((earning: any) => {
            allEarnings.push({
              ...earning,
              jobId: job.id || job.IsId, // Job ID'sini ekle
            });
          });
        }
      });
      
      console.log('Backend\'den toplanan tüm hakediş verileri:', allEarnings);
      
      const earnings = allEarnings.map((e: any) => {
        console.log('🔍 Ham hakediş verisi:', e);
        
        const mapped = {
          jobId: typeof e.isId === 'number' ? e.isId : parseInt(String(e.isId ?? e.jobId ?? 0), 10),
          personnelId: typeof e.personnelId === 'number' ? e.personnelId : parseInt(String(e.personnelId ?? 0), 10), // Sadece JsonPropertyName: "personnelId"
          payment: Number(e.payment ?? 0) || 0, // Sadece JsonPropertyName: "payment"
          daysWorked: Number(e.daysWorked ?? 0) || 0, // Sadece JsonPropertyName: "daysWorked"
          paymentMethod: e.paymentMethod ?? undefined, // Sadece JsonPropertyName: "paymentMethod"
        };
        
        console.log('🔍 Dönüştürülen hakediş:', mapped);
        return mapped;
      });
      
      console.log('Dönüştürülen hakediş verileri:', earnings);

      const normalizedJobs = normalizedJobsBase.map((job) => {
        // Bu job'a ait hakedişleri earnings'den filtrele
        const jobSpecificEarnings = earnings.filter(e => e.jobId === job.id);
        console.log(`🔍 Job ${job.id} için hakedişler:`, jobSpecificEarnings);
        
        // Eğer bu job için hakediş varsa, personnelPayments ve personnelIds'yi güncelle
        if (jobSpecificEarnings.length > 0) {
          const updatedPersonnelPayments = jobSpecificEarnings.map((p: any) => ({
            personnelId: p.personnelId,
            payment: p.payment,
            daysWorked: p.daysWorked,
            paymentMethod: p.paymentMethod,
          }));
          
          const updatedPersonnelIds = Array.from(new Set(jobSpecificEarnings.map(p => p.personnelId).filter((n: any) => typeof n === 'number' && n > 0)));
          
          console.log(`🔍 Job ${job.id} için güncellenmiş personel ID'leri:`, updatedPersonnelIds);
          console.log(`🔍 Job ${job.id} için güncellenmiş personel ödemeleri:`, updatedPersonnelPayments);
          
          return { 
            ...job, 
            personnelPayments: updatedPersonnelPayments, 
            personnelIds: updatedPersonnelIds 
          } as CustomerJob;
        }
        
        return job;
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
      
      // Puantaj verilerini ayrı olarak çek
      await fetchPuantajData();
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
      const user = await apiRequest('/Kullanicilar/login', 'POST', loginRequest);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      await fetchAllData(); 
      if (user.email === 'baris') persistCurrentView('timesheet');
      else persistCurrentView('customers');
      return true;
    } catch (error: any) {
      return error.message;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentView');
    setCurrentView('customers');
  };
  
  const handleNavigation = (view: View, id: number) => {
    setGlobalSearchQuery('');
    if (view === 'kasa') {
        persistCurrentView('kasa');
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
    const saved = await apiRequest('/Musteriler', 'POST', data);
    setCustomers(prev => [...prev, saved]);
  };
  const updateCustomer = async (data: Customer) => {
    const saved = await apiRequest(`/Musteriler/${data.id}`, 'PUT', data);
    // Eğer API updated objeyi döndürüyorsa onu kullan; dönmüyorsa data'yı kullan
    setCustomers(prev => prev.map(c => c.id === data.id ? (saved || data) : c));
  };
  const deleteCustomer = async (id: string) => {
    await apiRequest(`/Musteriler/${id}`, 'DELETE');
    await fetchAllData();
  };

 // Lütfen bu iki fonksiyonu App.tsx dosyanızdaki mevcut olanlarla değiştirin.

const addCustomerJob = async (data: Omit<CustomerJob, 'id'>) => {
    // Tarihi doğru formatta işle (YYYY-MM-DD formatında geliyor)
    const processedDate = data.date 
      ? (data.date.includes('T') ? data.date : `${data.date}T00:00:00`)
      : new Date().toISOString();
      
    const body = {
      customerId: data.customerId,
      location: data.location,
      description: data.description,
      date: processedDate,
      income: data.income,
      incomePaymentMethod: data.incomePaymentMethod,
      incomeGoldType: data.incomePaymentMethod === 'GOLD' ? data.incomeGoldType : null,
    };
    const saved = await apiRequest('/Musteriler/isler', 'POST', body);
    
    try {
        // HAKEDİŞLER İÇİN DOĞRU GÖNDERİM (camelCase)
        const earnings = (data.personnelPayments || []).map(p => ({
            personnelId: p.personnelId,
            payment: p.payment,
            daysWorked: p.daysWorked,
            paymentMethod: p.paymentMethod,
        }));
        if (earnings.length > 0) {
            await apiRequest(`/Musteriler/isler/${saved.id}/hakedisler/bulk`, 'POST', earnings);
        }

        // MALZEMELER İÇİN GÖNDERİM
        const materials = (data.materials || [])
            .filter(m => m.name && m.name.trim() !== '')
            .map(m => ({
                MalzemeAdi: m.name,
                Birim: m.unit,
                Miktar: m.quantity,
                BirimFiyat: m.unitPrice,
            }));
        if (materials.length > 0) {
            await apiRequest(`/Musteriler/isler/${saved.id}/malzemeler/bulk`, 'POST', materials);
        }
    } catch (e) {
        console.error("İş eklenirken hakediş/malzeme hatası:", e);
    }
    
    await fetchAllData();
  };

  const updateCustomerJob = async (data: CustomerJob) => {
    // Tarihi doğru formatta işle (YYYY-MM-DD formatında geliyor)
    const processedDate = data.date 
      ? (data.date.includes('T') ? data.date : `${data.date}T00:00:00`)
      : new Date().toISOString();
      
    const body = {
      id: data.id,
      customerId: data.customerId,
      location: data.location,
      description: data.description,
      date: processedDate,
      income: data.income,
      incomePaymentMethod: data.incomePaymentMethod,
      incomeGoldType: data.incomePaymentMethod === 'GOLD' ? data.incomeGoldType : null,
    };
    await apiRequest(`/Musteriler/isler/${data.id}`, 'PUT', body);
    
    try {
        // HAKEDİŞLER İÇİN DOĞRU GÖNDERİM (camelCase)
        const earnings = (data.personnelPayments || []).map(p => ({
            personnelId: p.personnelId,
            payment: p.payment,
            daysWorked: p.daysWorked,
            paymentMethod: p.paymentMethod,
        }));
        await apiRequest(`/Musteriler/isler/${data.id}/hakedisler/bulk`, 'POST', earnings);

        // MALZEMELER İÇİN GÖNDERİM
        const materials = (data.materials || [])
            .filter(m => m.name && m.name.trim() !== '')
            .map(m => ({
                MalzemeAdi: m.name,
                Birim: m.unit,
                Miktar: m.quantity,
                BirimFiyat: m.unitPrice,
            }));
        await apiRequest(`/Musteriler/isler/${data.id}/malzemeler/bulk`, 'POST', materials);

    } catch (e) {
        console.error("İş güncellenirken hakediş/malzeme hatası:", e);
    }
    
    await fetchAllData();
  };
  
  const deleteCustomerJob = async (id: string) => {
    await apiRequest(`/Musteriler/isler/${id}`, 'DELETE');
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
    
    const saved = await apiRequest('/Personel', 'POST', body);
    
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
    
    await apiRequest(`/Personel/${data.id}`, 'PUT', body);
    await fetchAllData();
  };
  const deletePersonnel = async (id: number) => {
    await apiRequest(`/Personel/${id}`, 'DELETE');
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
    const saved = await apiRequest('/Personel/odemeler', 'POST', body);
    setPersonnelPayments(prev => [...prev, saved]);
    // İlgili özetler ve bakiyeler için veriyi yenile
    await fetchAllData();
  };
  const deletePersonnelPayment = async (id: number) => {
    await apiRequest(`/Personel/odemeler/${id}`, 'DELETE');
    setPersonnelPayments(prev => prev.filter(p => p.id !== id));
  };

  // Puantaj Kayıtları CRUD Fonksiyonları
  const addPuantajKaydi = async (data: Omit<PuantajKayitlari, 'kayitId'>) => {
    const body = {
      personelId: data.personelId,
      musteriIsId: data.musteriIsId,
      tarih: data.tarih ? new Date(data.tarih).toISOString() : new Date().toISOString(),
      gunlukUcret: data.gunlukUcret,
      konum: data.konum || null,
      isTanimi: data.isTanimi || null,
    };
    await apiRequest('/Puantaj', 'POST', body);
    // Verileri yeniden çek
    await fetchPuantajData();
  };

  const updatePuantajKaydi = async (data: PuantajKayitlari) => {
    const body = {
      kayitId: data.kayitId,
      personelId: data.personelId,
      musteriIsId: data.musteriIsId,
      tarih: data.tarih ? new Date(data.tarih).toISOString() : new Date().toISOString(),
      gunlukUcret: data.gunlukUcret,
      konum: data.konum || null,
      isTanimi: data.isTanimi || null,
    };
    await apiRequest(`/Puantaj/${data.kayitId}`, 'PUT', body);
    // Verileri yeniden çek
    await fetchPuantajData();
  };

  const deletePuantajKaydi = async (kayitId: number) => {
    await apiRequest(`/Puantaj/${kayitId}`, 'DELETE');
    // Verileri yeniden çek
    await fetchPuantajData();
  };

  // Puantaj verilerini ayrı olarak çekme fonksiyonu
  const fetchPuantajData = async (startDate?: string, endDate?: string) => {
    try {
      let url = '/Puantaj';
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await apiRequest(url);
      console.log('🔍 Backend\'den gelen puantaj verileri:', data);
      
      const normalizedPuantajKayitlari: PuantajKayitlari[] = (data || []).map((p: any) => ({
        kayitId: p.kayitId ?? p.KayitId ?? p.id,
        personelId: p.personelId ?? p.PersonelId ?? p.personnelId,
        musteriIsId: p.musteriIsId ?? p.MusteriIsId ?? p.customerJobId,
        tarih: p.tarih ?? p.Tarih ?? p.date,
        gunlukUcret: Number(p.gunlukUcret ?? p.GunlukUcret ?? p.dailyWage ?? 0) || 0,
        konum: p.konum ?? p.Konum ?? p.location,
        isTanimi: p.isTanimi ?? p.IsTanimi ?? p.jobDescription,
      }));
      
      setPuantajKayitlari(normalizedPuantajKayitlari);
    } catch (error) {
      console.error("Puantaj verilerini çekerken hata:", error);
    }
  };
  
  const addUser = async (data: Omit<User, 'id'>) => {
      const saved = await apiRequest('/Kullanicilar', 'POST', data);
      setUsers(prev => [...prev, saved]);
  };
  const updateUser = async (data: User) => {
      await apiRequest(`/Kullanicilar/${data.id}`, 'PUT', data);
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
  };
  const deleteUser = async (id: string) => {
      await apiRequest(`/Kullanicilar/${id}`, 'DELETE');
      setUsers(prev => prev.filter(u => u.id !== id));
  };
  
  const addDefterEntry = async (data: Omit<DefterEntry, 'id'>) => {
      const saved = await apiRequest('/Kasa/defterkayitlari', 'POST', data);
      setDefterEntries(prev => [...prev, saved]);
  };
  const updateDefterEntry = async (data: DefterEntry) => {
      await apiRequest(`/Kasa/defterkayitlari/${data.id}`, 'PUT', data);
      setDefterEntries(prev => prev.map(e => e.id === data.id ? data : e));
  };
  const deleteDefterEntry = async (id: string) => {
      await apiRequest(`/Kasa/defterkayitlari/${id}`, 'DELETE');
      setDefterEntries(prev => prev.filter(e => e.id !== id));
  };

  const addDefterNote = async (data: Omit<DefterNote, 'id' | 'createdAt' | 'completed'>) => {
    try {
      // Backend /api/Kasa/defternotlari POST endpoint'ini çağır
      const saved = await apiRequest('/Kasa/defternotlari', 'POST', data);
      // State'i güncelle
      setDefterNotes(prev => [...prev, saved].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
        console.error('❌ Defter notu ekleme hatası:', error);
        alert('Defter notu eklenirken bir hata oluştu: ' + error.message);
    }
  };

  const updateDefterNote = async (data: DefterNote) => {
    try {
      // Backend /api/Kasa/defternotlari/{id} PUT endpoint'ini çağır
      const saved = await apiRequest(`/Kasa/defternotlari/${data.id}`, 'PUT', data);
      // State'i güncelle
      setDefterNotes(prev => prev.map(n => n.id === data.id ? saved : n));
    } catch (error: any) {
        console.error('❌ Defter notu güncelleme hatası:', error);
        alert('Defter notu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  const deleteDefterNote = async (id: string) => {
    try {
      // Backend /api/Kasa/defternotlari/{id} DELETE endpoint'ini çağır
      await apiRequest(`/Kasa/defternotlari/${id}`, 'DELETE');
      // State'i güncelle
      setDefterNotes(prev => prev.filter(n => n.id !== parseInt(id, 10))); // ID number olabilir, string'i number'a çevir
    } catch (error: any) {
        console.error('❌ Defter notu silme hatası:', error);
        alert('Defter notu silinirken bir hata oluştu: ' + error.message);
    }
  };

  const addSharedExpense = async (data: Omit<SharedExpense, 'id'>) => {
    if (!data.description || data.description.trim() === '') {
        alert('Açıklama alanı boş bırakılamaz!');
        return;
    }

    // Tutar kontrolü ekle
    if (!data.amount || data.amount <= 0) {
        alert('Tutar 0\'dan büyük olmalıdır!');
        return;
    }

    try {
        // Tarih formatını kontrol et ve düzelt
        let formattedDate = data.date;
        if (!formattedDate) {
            formattedDate = new Date().toISOString();
        } else if (!formattedDate.includes('T')) {
            // YYYY-MM-DD formatındaysa ISO formatına çevir
            formattedDate = new Date(formattedDate).toISOString();
        }

        // Backend'in beklediği camelCase format (JsonPropertyName attribute'larına uygun)
        const payload = {
            description: data.description.trim(),
            amount: parseFloat(data.amount.toString()) || 0,
            date: formattedDate,
            paymentMethod: data.paymentMethod,
            payer: data.payer,
            status: data.status || 'unpaid'
        };
        
        console.log('🔍 Gider Ekleme Debug:', {
            originalData: data,
            payload: payload,
            API_BASE_URL: API_BASE_URL,
            dateTransformation: {
                original: data.date,
                formatted: formattedDate
            }
        });

        const saved = await apiRequest('/Kasa/ortakgiderler', 'POST', payload);
        console.log('✅ Backend\'den gelen veri:', saved);
        
        // Backend → Frontend dönüşümü - daha güvenli mapping
        const frontendData: SharedExpense = {
            id: saved.id || saved.giderId || saved.GiderId || Date.now(), // Fallback ID
            description: saved.description || saved.aciklama || saved.Aciklama || data.description,
            amount: Number(saved.amount || saved.tutar || saved.Tutar || data.amount) || 0,
            date: saved.date || saved.tarih || saved.Tarih || formattedDate,
            paymentMethod: saved.paymentMethod || saved.odemeYontemi || saved.OdemeYontemi || data.paymentMethod || 'cash',
            payer: saved.payer || saved.odeyenKisi || saved.OdeyenKisi || data.payer || 'Kasa',
            status: saved.status || saved.durum || saved.Durum || data.status || 'unpaid',
            deletedAt: saved.deletedAt || saved.silinmeTarihi
        };
        
        console.log('🔍 Frontend Data:', frontendData);
        console.log('🔍 Mevcut SharedExpenses:', sharedExpenses.length);
        
        // State'i güncelle
        setSharedExpenses(prev => {
            const updated = [...prev, frontendData];
            console.log('🔍 Güncellenmiş SharedExpenses:', updated.length);
            return updated;
        });
        
        // Tüm verileri yeniden yükle - backend formatı tutarsız olabilir
        console.log('🔄 Tüm veriler yeniden yükleniyor...');
        await fetchAllData();
        
        console.log('✅ Gider başarıyla eklendi:', frontendData);
        
    } catch (error: any) {
        console.error('❌ Gider ekleme hatası:', error);
        
        // Daha detaylı hata mesajı
        let errorMessage = 'Gider eklenirken bir hata oluştu';
        
        if (error.message.includes('400')) {
            errorMessage = 'Gönderilen veri formatı hatalı. Lütfen tüm alanları kontrol edin.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else if (error.message.includes('timeout') || error.message.includes('504')) {
            errorMessage = 'İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        } else {
            errorMessage = `Hata: ${error.message}`;
        }
        
        alert(errorMessage);
    }
};

const updateSharedExpense = async (data: SharedExpense) => {
    try {
        // Tarih formatını kontrol et ve düzelt
        let formattedDate = data.date;
        if (!formattedDate) {
            formattedDate = new Date().toISOString();
        } else if (!formattedDate.includes('T')) {
            formattedDate = new Date(formattedDate).toISOString();
        }

        // Backend'in beklediği camelCase format (JsonPropertyName attribute'larına uygun)
        const payload = {
            description: data.description,
            amount: parseFloat(data.amount.toString()) || 0,
            date: formattedDate,
            paymentMethod: data.paymentMethod,
            payer: data.payer,
            status: data.status
        };
        
        console.log('🔍 Güncelleme Payload:', {
            originalData: data,
            payload: payload,
            endpoint: `/Kasa/ortakgiderler/${data.id}`
        });

        const saved = await apiRequest(`/Kasa/ortakgiderler/${data.id}`, 'PUT', payload);
        
        // Backend'den gelen veriyi frontend formatına çevir
        const updatedData: SharedExpense = {
            id: saved.id || saved.giderId || saved.GiderId || data.id,
            description: saved.description || saved.aciklama || saved.Aciklama || data.description,
            amount: saved.amount || saved.tutar || saved.Tutar || data.amount,
            date: saved.date || saved.tarih || saved.Tarih || data.date,
            paymentMethod: saved.paymentMethod || saved.odemeYontemi || saved.OdemeYontemi || data.paymentMethod,
            payer: saved.payer || saved.odeyenKisi || saved.OdeyenKisi || data.payer,
            status: saved.status || saved.durum || saved.Durum || data.status,
            deletedAt: saved.deletedAt || saved.silinmeTarihi || data.deletedAt
        };
        
        setSharedExpenses(prev => prev.map(e => e.id === data.id ? updatedData : e));
        console.log('✅ Gider başarıyla güncellendi:', updatedData);
    } catch (error: any) {
        console.error('Gider güncelleme hatası:', error);
        
        // Daha detaylı hata mesajı
        let errorMessage = 'Gider güncellenirken bir hata oluştu';
        
        if (error.message.includes('400')) {
            errorMessage = 'Gönderilen veri formatı hatalı. Lütfen tüm alanları kontrol edin.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else if (error.message.includes('timeout') || error.message.includes('504')) {
            errorMessage = 'İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        } else {
            errorMessage = `Hata: ${error.message}`;
        }
        
        alert(errorMessage);
    }
};

const deleteSharedExpense = async (expenseId: number) => {
    try {
         await apiRequest(`/Kasa/ortakgiderler/${expenseId}`, 'DELETE');

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
         await apiRequest(`/Kasa/ortakgiderler/${expenseId}/restore`, 'POST');

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
        await apiRequest(`/Kasa/ortakgiderler/${expenseId}/permanent`, 'DELETE');
        
        // Backend'den başarılı yanıt gelirse, frontend'den de kaldır
        setSharedExpenses(prev => prev.filter(e => e.id !== expenseId));
        console.log('✅ Gider kalıcı olarak silindi');
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
      <Sidebar currentView={currentView} setCurrentView={handleSidebarViewChange} currentUser={currentUser} isOpen={isSidebarOpen} />
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
                {currentView === 'timesheet' && (
                  <PuantajView
                    currentUser={currentUser}
                    personnel={personnel}
                    customers={customers}
                    customerJobs={customerJobs}
                    puantajKayitlari={puantajKayitlari}
                    onAddPuantajKaydi={addPuantajKaydi}
                    onUpdatePuantajKaydi={updatePuantajKaydi}
                    onDeletePuantajKaydi={deletePuantajKaydi}
                    onFetchPuantajData={fetchPuantajData}
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
                    onAddDefterNote={addDefterNote}
                    onUpdateDefterNote={updateDefterNote}
                    onDeleteDefterNote={deleteDefterNote}
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