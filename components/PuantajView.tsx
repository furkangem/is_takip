import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Personnel, User, Role, CustomerJob, Customer, PuantajKayitlari } from '../types';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, ClipboardDocumentListIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

const AddPuantajModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (kayit: PuantajKayitlari | Omit<PuantajKayitlari, 'kayitId'>) => void;
    personnel: Personnel[];
    customerJobs: CustomerJob[];
    kayitToEdit: PuantajKayitlari | null;
}> = ({ isOpen, onClose, onSave, personnel, customerJobs, kayitToEdit }) => {
    const [personelId, setPersonelId] = useState<string>('');
    const [musteriIsId, setMusteriIsId] = useState<string>('');
    const [tarih, setTarih] = useState<string>('');
    const [gunlukUcret, setGunlukUcret] = useState<string>('');
    const [konum, setKonum] = useState<string>('');
    const [isTanimi, setIsTanimi] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            if (kayitToEdit) {
                setPersonelId(kayitToEdit.personelId.toString());
                setMusteriIsId(kayitToEdit.musteriIsId.toString());
                setTarih(kayitToEdit.tarih.split('T')[0]);
                setGunlukUcret(kayitToEdit.gunlukUcret.toString());
                setKonum(kayitToEdit.konum || '');
                setIsTanimi(kayitToEdit.isTanimi || '');
            } else {
                setPersonelId('');
                setMusteriIsId('');
                setTarih(new Date().toISOString().split('T')[0]);
                setGunlukUcret('');
                setKonum('');
                setIsTanimi('');
            }
        }
    }, [isOpen, kayitToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!personelId || !musteriIsId || !tarih || !gunlukUcret) {
            alert('Personel, iş, tarih ve günlük ücret alanları zorunludur!');
            return;
        }
        
        const numericUcret = parseFloat(gunlukUcret);
        if (isNaN(numericUcret) || numericUcret < 0) {
            alert('Günlük ücret geçerli bir sayı olmalıdır!');
            return;
        }

        const kayitData = {
            personelId: parseInt(personelId),
            musteriIsId: parseInt(musteriIsId),
            tarih: new Date(tarih).toISOString(),
            gunlukUcret: numericUcret,
            konum: konum.trim() || undefined,
            isTanimi: isTanimi.trim() || undefined,
        };
        
        if (kayitToEdit) {
            onSave({ ...kayitToEdit, ...kayitData });
        } else {
            onSave(kayitData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {kayitToEdit ? 'Puantaj Kaydını Düzenle' : 'Yeni Puantaj Kaydı Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="personel-id" className="block text-sm font-medium text-gray-700">Personel</label>
                        <select
                            id="personel-id"
                            value={personelId}
                            onChange={(e) => setPersonelId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Personel Seçin</option>
                            {personnel.map(person => (
                                <option key={person.id} value={person.id}>{person.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="musteri-is-id" className="block text-sm font-medium text-gray-700">İş</label>
                        <select
                            id="musteri-is-id"
                            value={musteriIsId}
                            onChange={(e) => setMusteriIsId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">İş Seçin</option>
                            {customerJobs.map(job => (
                                <option key={job.id} value={job.id}>{job.location} - {job.description}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tarih" className="block text-sm font-medium text-gray-700">Tarih</label>
                        <input
                            type="date"
                            id="tarih"
                            value={tarih}
                            onChange={(e) => setTarih(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="gunluk-ucret" className="block text-sm font-medium text-gray-700">Günlük Ücret (₺)</label>
                        <input
                            type="number"
                            id="gunluk-ucret"
                            value={gunlukUcret}
                            onChange={(e) => setGunlukUcret(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                            placeholder="Örn: 500"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label htmlFor="konum" className="block text-sm font-medium text-gray-700">Konum (Opsiyonel)</label>
                        <input
                            type="text"
                            id="konum"
                            value={konum}
                            onChange={(e) => setKonum(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Çalışma konumu"
                        />
                    </div>
                    <div>
                        <label htmlFor="is-tanimi" className="block text-sm font-medium text-gray-700">İş Tanımı (Opsiyonel)</label>
                        <textarea
                            id="is-tanimi"
                            value={isTanimi}
                            onChange={(e) => setIsTanimi(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Yapılan işin detayları"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface PuantajViewProps {
  currentUser: User;
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  puantajKayitlari: PuantajKayitlari[];
  onAddPuantajKaydi: (kayit: Omit<PuantajKayitlari, 'kayitId'>) => void;
  onUpdatePuantajKaydi: (kayit: PuantajKayitlari) => void;
  onDeletePuantajKaydi: (kayitId: number) => void;
  onFetchPuantajData: (startDate?: string, endDate?: string) => Promise<void>;
}

const PuantajView: React.FC<PuantajViewProps> = ({ 
  currentUser, 
  personnel, 
  customers, 
  customerJobs, 
  puantajKayitlari, 
  onAddPuantajKaydi, 
  onUpdatePuantajKaydi, 
  onDeletePuantajKaydi,
  onFetchPuantajData
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kayitToEdit, setKayitToEdit] = useState<PuantajKayitlari | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [kayitToDelete, setKayitToDelete] = useState<PuantajKayitlari | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  // Varsayılan tarihleri ayarla
  React.useEffect(() => {
    if (!filters.startDate || !filters.endDate) {
      const defaultStart = new Date('2023-01-01');
      const today = new Date();
      setFilters({ 
        startDate: defaultStart.toISOString().split('T')[0], 
        endDate: today.toISOString().split('T')[0] 
      });
    }
  }, []);

  const filteredPuantaj = useMemo(() => {
    let filtered = puantajKayitlari;
    
    // Tarih filtresi
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if(end) end.setHours(23,59,59,999);

    filtered = filtered.filter(kayit => {
      const kayitTarih = new Date(kayit.tarih);
      if(start && kayitTarih < start) return false;
      if(end && kayitTarih > end) return false;
      return true;
    });

    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter(kayit => {
        const person = personnel.find(p => p.id === kayit.personelId);
        const job = customerJobs.find(j => j.id === kayit.musteriIsId);
        const customer = customers.find(c => c.id === job?.customerId);
        
        return (
          person?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job?.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kayit.konum?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kayit.isTanimi?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
  }, [puantajKayitlari, filters, searchQuery, personnel, customerJobs, customers]);

  const handleOpenAddModal = () => { 
    setKayitToEdit(null); 
    setIsModalOpen(true); 
  };

  const handleOpenEditModal = (kayit: PuantajKayitlari) => { 
    setKayitToEdit(kayit); 
    setIsModalOpen(true); 
  };

  const handleOpenDeleteModal = (kayit: PuantajKayitlari) => { 
    setKayitToDelete(kayit); 
    setIsDeleteModalOpen(true); 
  };

  const handleConfirmDelete = () => {
    if (kayitToDelete) {
        onDeletePuantajKaydi(kayitToDelete.kayitId);
        setIsDeleteModalOpen(false);
        setKayitToDelete(null);
    }
  };

  const handleSave = (data: PuantajKayitlari | Omit<PuantajKayitlari, 'kayitId'>) => {
    if ('kayitId' in data) {
      onUpdatePuantajKaydi(data);
    } else {
      onAddPuantajKaydi(data);
    }
  };

  const handleDownloadPdf = async () => {
    if (filteredPuantaj.length === 0) {
      alert('İndirilecek puantaj kaydı bulunmuyor.');
      return;
    }

    try {
      const startDate = filters.startDate || new Date('2023-01-01').toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'personel'
      });

      const response = await fetch(`/api/puantaj/report/pdf?${params}`);
      
      if (!response.ok) {
        throw new Error('PDF oluşturulurken hata oluştu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Puantaj_Raporu_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      alert('PDF indirilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const setDateRange = (period: 'this_month' | 'last_month' | 'all' | 'default') => {
    if (period === 'all') {
      setFilters({ startDate: '', endDate: '' });
      onFetchPuantajData();
      return;
    }
    if (period === 'default') {
      const defaultStart = new Date('2023-01-01');
      const today = new Date();
      const newFilters = { 
        startDate: defaultStart.toISOString().split('T')[0], 
        endDate: today.toISOString().split('T')[0] 
      };
      setFilters(newFilters);
      onFetchPuantajData(newFilters.startDate, newFilters.endDate);
      return;
    }
    const now = new Date();
    let start, end;
    if (period === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else { // last_month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    }
    const newFilters = { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    setFilters(newFilters);
    onFetchPuantajData(newFilters.startDate, newFilters.endDate);
  };

  const isEditable = currentUser.role === Role.SUPER_ADMIN;
  const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  // İstatistikler
  const stats = useMemo(() => {
    const totalDays = filteredPuantaj.length;
    const totalEarnings = filteredPuantaj.reduce((sum, kayit) => sum + kayit.gunlukUcret, 0);
    const uniquePersonnel = new Set(filteredPuantaj.map(k => k.personelId)).size;
    
    return { totalDays, totalEarnings, uniquePersonnel };
  }, [filteredPuantaj]);

  return (
    <>
      <div className="space-y-6">
        {/* Başlık ve İstatistikler */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <CalendarDaysIcon className="h-8 w-8 mr-3 text-blue-600"/>
                Puantaj Yönetimi
              </h2>
              <p className="text-gray-500 text-sm mt-1">Personel çalışma kayıtları ve raporları</p>
            </div>
            {isEditable && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button 
                  onClick={handleOpenAddModal} 
                  className="flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Puantaj Ekle
                </button>
                <button 
                  onClick={handleDownloadPdf} 
                  className="flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                  disabled={filteredPuantaj.length === 0}
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  PDF İndir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Toplam Çalışma Günü" value={stats.totalDays.toString()} icon={CalendarDaysIcon} color="blue" />
          <StatCard title="Toplam Hakediş" value={formatCurrency(stats.totalEarnings)} icon={ClipboardDocumentListIcon} color="green" />
          <StatCard title="Çalışan Personel" value={stats.uniquePersonnel.toString()} icon={CalendarDaysIcon} color="purple" />
        </div>

        {/* Filtreler */}
        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Puantaj Kayıtları</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end">
              <input 
                type="date" 
                value={filters.startDate} 
                onChange={e => {
                  const newFilters = {...filters, startDate: e.target.value};
                  setFilters(newFilters);
                  onFetchPuantajData(newFilters.startDate, newFilters.endDate);
                }} 
                className={commonInputClass} 
              />
              <input 
                type="date" 
                value={filters.endDate} 
                onChange={e => {
                  const newFilters = {...filters, endDate: e.target.value};
                  setFilters(newFilters);
                  onFetchPuantajData(newFilters.startDate, newFilters.endDate);
                }} 
                className={commonInputClass} 
              />
              <button onClick={() => setDateRange('default')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Varsayılan</button>
              <button onClick={() => setDateRange('this_month')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Bu Ay</button>
              <button onClick={() => setDateRange('all')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Tümü</button>
            </div>
          </div>
          
          {/* Arama */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Personel, iş, müşteri veya konum ara..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Puantaj Listesi */}
          <div className="bg-gray-50 rounded-lg border flex-1 overflow-y-auto min-h-[400px]">
            {filteredPuantaj.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredPuantaj.map(kayit => {
                  const person = personnel.find(p => p.id === kayit.personelId);
                  const job = customerJobs.find(j => j.id === kayit.musteriIsId);
                  const customer = customers.find(c => c.id === job?.customerId);
                  
                  return (
                    <li key={kayit.kayitId} className="p-4 flex justify-between items-center group hover:bg-gray-100">
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium text-gray-800">
                            {person?.name || 'Bilinmeyen Personel'}
                          </p>
                          <p className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                            {formatDate(kayit.tarih)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {job ? job.location : `İş #${kayit.musteriIsId}`} - {customer?.name || 'Bilinmeyen Müşteri'}
                        </p>
                        {job?.description && (
                          <p className="text-xs text-gray-500 mt-1">{job.description}</p>
                        )}
                        {kayit.konum && (
                          <p className="text-xs text-blue-600 mt-1">📍 {kayit.konum}</p>
                        )}
                        {kayit.isTanimi && (
                          <p className="text-xs text-gray-500 mt-1">{kayit.isTanimi}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 min-w-[120px]">
                        <p className="font-bold text-lg text-green-600">
                          {formatCurrency(kayit.gunlukUcret)}
                        </p>
                        {isEditable && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenEditModal(kayit)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Düzenle"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenDeleteModal(kayit)}
                              className="text-red-600 hover:text-red-800"
                              title="Sil"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mb-4"/>
                <div>
                  <p className="text-gray-500 font-medium">Puantaj Kaydı Bulunmuyor</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery || filters.startDate || filters.endDate 
                      ? "Arama kriterlerinize uygun kayıt bulunamadı." 
                      : "Başlamak için yeni bir puantaj kaydı ekleyin."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {isModalOpen && (
          <AddPuantajModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
            personnel={personnel} 
            customerJobs={customerJobs}
            kayitToEdit={kayitToEdit}
          />
        )}
        {isDeleteModalOpen && (
          <ConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={handleConfirmDelete} 
            title="Puantaj Kaydını Sil" 
            message={`${kayitToDelete ? formatDate(kayitToDelete.tarih) : ''} tarihli ${kayitToDelete ? formatCurrency(kayitToDelete.gunlukUcret) : ''} tutarındaki puantaj kaydını silmek istediğinizden emin misiniz?`}
          />
        )}
      </Suspense>
    </>
  );
};

export default PuantajView;
