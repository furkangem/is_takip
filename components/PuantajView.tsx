import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Personnel, User, Role, CustomerJob, Customer, PuantajKayitlari } from '../types';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, ClipboardDocumentListIcon, BuildingOffice2Icon, UserGroupIcon, DocumentCheckIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

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
  const [viewMode, setViewMode] = useState<'job' | 'personnel'>('job');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(null);
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

  // Müşteri listesini filtrele
  const filteredCustomers = useMemo(() => {
    let customersWithJobs = customers;
    
    // Tarih filtresi
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if(end) end.setHours(23,59,59,999);

    // Müşterileri filtrele - sadece belirtilen tarih aralığında işi olan müşteriler
    customersWithJobs = customersWithJobs.filter(customer => {
      const customerJobsForThisCustomer = customerJobs.filter(job => {
        const jobDate = new Date(job.date);
        if(start && jobDate < start) return false;
        if(end && jobDate > end) return false;
        return job.customerId === customer.id;
      });
      return customerJobsForThisCustomer.length > 0;
    });

    // Arama filtresi
    if (searchQuery) {
      customersWithJobs = customersWithJobs.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return customersWithJobs.sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, customerJobs, filters, searchQuery]);

  // Personel listesini filtrele
  const filteredPersonnel = useMemo(() => {
    let personel = personnel;

    // Arama filtresi
    if (searchQuery) {
      personel = personel.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return personel.sort((a, b) => a.name.localeCompare(b.name));
  }, [personnel, searchQuery]);

  // Seçilen müşterinin detayları
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  // Seçilen müşterinin işleri
  const selectedCustomerJobs = useMemo(() => {
    if (!selectedCustomerId) return [];
    
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if(end) end.setHours(23,59,59,999);

    return customerJobs.filter(job => {
      if (job.customerId !== selectedCustomerId) return false;
      
      const jobDate = new Date(job.date);
      if(start && jobDate < start) return false;
      if(end && jobDate > end) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomerId, customerJobs, filters]);

  // Seçilen işin detayları
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return customerJobs.find(job => job.id === selectedJobId);
  }, [selectedJobId, customerJobs]);

  // Seçilen personelin detayları
  const selectedPersonnel = useMemo(() => {
    if (!selectedPersonnelId) return null;
    return personnel.find(p => p.id === selectedPersonnelId);
  }, [selectedPersonnelId, personnel]);

  // Seçilen işe ait puantaj kayıtları
  const jobPuantajRecords = useMemo(() => {
    if (!selectedJobId) return [];
    
    return puantajKayitlari.filter(kayit => kayit.musteriIsId === selectedJobId);
  }, [selectedJobId, puantajKayitlari]);

  // Seçilen personelin puantaj kayıtları
  const personnelPuantajRecords = useMemo(() => {
    if (!selectedPersonnelId) return [];
    
    return puantajKayitlari.filter(kayit => kayit.personelId === selectedPersonnelId);
  }, [selectedPersonnelId, puantajKayitlari]);

  const handleDownloadPdf = async () => {
    try {
      const startDate = filters.startDate || new Date('2023-01-01').toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: viewMode === 'job' ? 'is' : 'personel'
      });

      // Backend endpoint'ini kontrol et
      const response = await fetch(`/Puantaj/report/pdf?${params}`);
      
      if (!response.ok) {
        throw new Error(`PDF oluşturulurken hata oluştu: ${response.status} ${response.statusText}`);
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
      alert(`PDF indirilirken hata oluştu: ${error.message}`);
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

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Üst Filtreler ve Butonlar */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Görünüm Modu Butonları */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('job')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'job'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BuildingOffice2Icon className="h-4 w-4 inline mr-2" />
                İş'e Göre
              </button>
              <button
                onClick={() => setViewMode('personnel')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'personnel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 inline mr-2" />
                Personel'e Göre
              </button>
            </div>

            {/* Tarih Filtreleri */}
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={e => {
                    const newFilters = {...filters, startDate: e.target.value};
                    setFilters(newFilters);
                    onFetchPuantajData(newFilters.startDate, newFilters.endDate);
                  }} 
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={e => {
                    const newFilters = {...filters, endDate: e.target.value};
                    setFilters(newFilters);
                    onFetchPuantajData(newFilters.startDate, newFilters.endDate);
                  }} 
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* PDF İndirme Butonu */}
            <button 
              onClick={handleDownloadPdf} 
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              PDF Raporu İndir
            </button>
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Sol Panel - Liste */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[600px]">
              {viewMode === 'job' ? (
                // Müşteri Listesi
                <div>
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setSelectedJobId(null);
                        setSelectedPersonnelId(null);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b ${
                        selectedCustomerId === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{customer.name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // Personel Listesi
                <div>
                  {filteredPersonnel.map(person => (
                    <button
                      key={person.id}
                      onClick={() => {
                        setSelectedPersonnelId(person.id);
                        setSelectedJobId(null);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b ${
                        selectedPersonnelId === person.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{person.name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ Panel - Detaylar */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
            {viewMode === 'job' && selectedCustomer ? (
              // Müşteri Detayları ve İşleri
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                  <p className="text-gray-600">Müşteri İşleri</p>
                </div>

                {/* Müşteri İşleri Listesi */}
                <div className="space-y-4">
                  {selectedCustomerJobs.length > 0 ? (
                    selectedCustomerJobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800">{job.location}</h3>
                            <p className="text-sm text-gray-600">{job.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(job.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(job.income)}</p>
                          </div>
                        </div>
                        
                        {/* Bu işe ait puantaj kayıtları */}
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Personel Puantaj Kayıtları:</h4>
                          {jobPuantajRecords.filter(kayit => kayit.musteriIsId === job.id).length > 0 ? (
                            <div className="space-y-2">
                              {jobPuantajRecords.filter(kayit => kayit.musteriIsId === job.id).map(kayit => {
                                const person = personnel.find(p => p.id === kayit.personelId);
                                return (
                                  <div key={kayit.kayitId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center">
                                      <UserGroupIcon className="h-4 w-4 text-gray-500 mr-2" />
                                      <span className="text-sm font-medium text-gray-800">{person?.name || 'Bilinmeyen Personel'}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-gray-800">{formatCurrency(kayit.gunlukUcret)}</p>
                                      <p className="text-xs text-gray-500">{formatDate(kayit.tarih)}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Bu iş için puantaj kaydı bulunmuyor.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">Bu müşteri için seçilen tarih aralığında iş bulunmuyor.</p>
                  )}
                </div>
              </div>
            ) : viewMode === 'personnel' && selectedPersonnel ? (
              // Personel Detayları
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedPersonnel.name}</h2>
                  <p className="text-gray-600">Personel Puantaj Detayları</p>
                </div>

                {/* Personel Puantaj Kayıtları */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    Puantaj Kayıtları
                  </h3>
                  
                  {personnelPuantajRecords.length > 0 ? (
                    <div className="space-y-3">
                      {personnelPuantajRecords.map(kayit => {
                        const job = customerJobs.find(j => j.id === kayit.musteriIsId);
                        const customer = customers.find(c => c.id === job?.customerId);
                        return (
                          <div key={kayit.kayitId} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{job?.location || 'Bilinmeyen İş'}</p>
                                <p className="text-sm text-gray-600">{customer?.name} - {job?.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(kayit.tarih)}</p>
                                {kayit.konum && (
                                  <p className="text-xs text-blue-600 mt-1">📍 {kayit.konum}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">{formatCurrency(kayit.gunlukUcret)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Bu personel için puantaj kaydı bulunmuyor.</p>
                  )}
                </div>
              </div>
            ) : (
              // Seçim Yapılmamış
              <div className="flex flex-col items-center justify-center h-full p-8">
                <CalendarDaysIcon className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">Detayları görmek için bir {viewMode === 'job' ? 'müşteri' : 'personel'} seçin</p>
                <p className="text-gray-400 text-sm mt-2">Sol panelden bir {viewMode === 'job' ? 'müşteri' : 'personel'} seçerek detaylarını görüntüleyebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PuantajView;