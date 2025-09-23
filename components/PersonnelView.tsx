

import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, User, Role, PersonnelPayment, CustomerJob, Customer } from '../types';
import { UserGroupIcon, IdentificationIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CreditCardIcon, XMarkIcon, BriefcaseIcon, BanknotesIcon, TrendingUpIcon, TrendingDownIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';
import StatCard from './ui/StatCard';

interface PersonnelViewProps {
  currentUser: User;
  users: User[];
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnelPayments: PersonnelPayment[];
  onAddPersonnel: (personnel: Omit<Personnel, 'id'>) => void;
  onUpdatePersonnel: (personnel: Personnel) => void;
  onDeletePersonnel: (personnelId: string) => void;
  onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
  onDeletePersonnelPayment: (paymentId: string) => void;
  navigateToId: string | null;
  onNavigationComplete: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

const JobPaymentDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    job: CustomerJob | null;
    personnel: Personnel[];
    customer: Customer | undefined;
}> = ({ isOpen, onClose, job, personnel, customer }) => {
    if (!isOpen || !job) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-500" />
                            İş Hakediş Detayları
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{job.location} - {customer?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4">Bu işte çalışan personeller ve hakediş tutarları aşağıda listelenmiştir.</p>
                    {job.personnelIds.length > 0 ? (
                        <ul className="divide-y divide-gray-200 border rounded-md bg-gray-50/50">
                            {job.personnelIds.map(personnelId => {
                                const person = personnel.find(p => p.id === personnelId);
                                const paymentInfo = job.personnelPayments.find(p => p.personnelId === personnelId);
                                const paymentAmount = paymentInfo ? paymentInfo.payment : 0;
                                return (
                                    <li key={personnelId} className="px-4 py-3 flex justify-between items-center">
                                        <span className="font-medium text-gray-800">{person ? person.name : 'Bilinmeyen Personel'}</span>
                                        <span className="font-bold text-blue-600">{formatCurrency(paymentAmount)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Bu işe atanmış personel bulunmuyor.</p>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

const PersonnelEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (personnel: Personnel | Omit<Personnel, 'id'>) => void;
    personnelToEdit: Personnel | null;
}> = ({ isOpen, onClose, onSave, personnelToEdit }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (personnelToEdit) {
                setName(personnelToEdit.name);
            } else {
                setName('');
            }
        }
    }, [isOpen, personnelToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Lütfen tüm alanları doğru bir şekilde doldurun.');
            return;
        }

        const personnelData = {
            name,
        };
        
        if (personnelToEdit) {
            onSave({ ...personnelToEdit, ...personnelData });
        } else {
            onSave(personnelData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {personnelToEdit ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="personnel-name" className="block text-sm font-medium text-gray-700">İsim Soyisim</label>
                        <input
                            type="text"
                            id="personnel-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required autoFocus
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentData: {amount: number, jobId?: string}) => void;
    personnel: Personnel;
    personnelJobs: CustomerJob[];
}> = ({ isOpen, onClose, onSave, personnel, personnelJobs }) => {
    const [amount, setAmount] = useState('');
    const [jobId, setJobId] = useState<string>('');

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setJobId('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen geçerli bir ödeme tutarı girin.');
            return;
        }
        onSave({amount: numericAmount, jobId: jobId || undefined});
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Ödeme Ekle: {personnel.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700">Ödeme Tutarı (₺)</label>
                        <input
                            type="number"
                            id="payment-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required autoFocus
                            placeholder="Örn: 5000"
                        />
                    </div>
                     <div>
                        <label htmlFor="job-id" className="block text-sm font-medium text-gray-700">İş (Opsiyonel)</label>
                        <select
                            id="job-id"
                            value={jobId}
                            onChange={(e) => setJobId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Genel Ödeme</option>
                            {personnelJobs.map(job => (
                                <option key={job.id} value={job.id}>{job.location} - {job.description}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PersonnelView: React.FC<PersonnelViewProps> = ({ currentUser, users, personnel, customers, customerJobs, personnelPayments, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onAddPersonnelPayment, onDeletePersonnelPayment, navigateToId, onNavigationComplete }) => {
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(personnel.length > 0 ? personnel[0] : null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<CustomerJob | null>(null);


  useEffect(() => {
    if (navigateToId) {
        const person = personnel.find(p => p.id === navigateToId);
        if (person) {
            setSelectedPersonnel(person);
            setSearchQuery('');
        }
        onNavigationComplete();
    }
  }, [navigateToId, personnel, onNavigationComplete]);

  const filteredPersonnel = useMemo(() => {
    if (!searchQuery) return personnel;
    return personnel.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [personnel, searchQuery]);

  useEffect(() => {
    if (selectedPersonnel && !filteredPersonnel.find(p => p.id === selectedPersonnel.id)) {
        setSelectedPersonnel(filteredPersonnel.length > 0 ? filteredPersonnel[0] : null);
    } else if (!selectedPersonnel && filteredPersonnel.length > 0) {
        setSelectedPersonnel(filteredPersonnel[0]);
    } else if (filteredPersonnel.length === 0) {
        setSelectedPersonnel(null);
    }
  }, [filteredPersonnel, selectedPersonnel]);

  const handleOpenAddModal = () => { setPersonnelToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (p: Personnel) => { setPersonnelToEdit(p); setIsModalOpen(true); };
  const handleOpenDeleteModal = (p: Personnel) => { setPersonnelToDelete(p); setIsDeleteModalOpen(true); };

  const handleConfirmDelete = () => {
    if (personnelToDelete) {
        onDeletePersonnel(personnelToDelete.id);
        setIsDeleteModalOpen(false);
        setPersonnelToDelete(null);
    }
  };
  
  const handleConfirmDeletePayment = () => {
      if(paymentToDelete) {
          onDeletePersonnelPayment(paymentToDelete.id);
          setPaymentToDelete(null);
      }
  };

  const handleSavePersonnel = (data: Personnel | Omit<Personnel, 'id'>) => {
    if ('id' in data) {
      onUpdatePersonnel(data);
      if(selectedPersonnel?.id === data.id) {
        setSelectedPersonnel(data);
      }
    } else {
      onAddPersonnel(data);
    }
  };

  const handleSelectPersonnel = (p: Personnel) => {
    if (selectedPersonnel?.id !== p.id) {
      setSelectedPersonnel(p);
    }
  };

  const handleAddPayment = (paymentData: {amount: number, jobId?: string}) => {
    if(selectedPersonnel) {
        onAddPersonnelPayment({
            personnelId: selectedPersonnel.id,
            amount: paymentData.amount,
            customerJobId: paymentData.jobId,
            date: new Date().toISOString()
        });
    }
  };
  
  const handleOpenJobDetails = (job: CustomerJob) => {
    setSelectedJobForDetails(job);
    setJobDetailsModalOpen(true);
  };

  const { totalPaymentDue, totalPaid, balance, jobs, payments } = useMemo(() => {
    if (!selectedPersonnel) return { totalPaymentDue: 0, totalPaid: 0, balance: 0, jobs: [], payments: [] };
    
    // Overall totals (not filtered)
    const allPersonnelJobs = customerJobs.filter(job => job.personnelIds.includes(selectedPersonnel.id));
    const due = allPersonnelJobs.reduce((sum, job) => {
        const personnelEarning = job.personnelPayments.find(p => p.personnelId === selectedPersonnel.id);
        return sum + (personnelEarning?.payment || 0);
    }, 0);
    const allPersonnelPayments = personnelPayments.filter(p => p.personnelId === selectedPersonnel.id);
    const paid = allPersonnelPayments.reduce((sum, p) => sum + p.amount, 0);

    // Filtered lists
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if(end) end.setHours(23,59,59,999);

    const filteredJobs = allPersonnelJobs.filter(j => {
        const jobDate = new Date(j.date);
        if(start && jobDate < start) return false;
        if(end && jobDate > end) return false;
        return true;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredPayments = allPersonnelPayments.filter(p => {
        const paymentDate = new Date(p.date);
        if(start && paymentDate < start) return false;
        if(end && paymentDate > end) return false;
        return true;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        totalPaymentDue: due,
        totalPaid: paid,
        balance: due - paid,
        jobs: filteredJobs,
        payments: filteredPayments,
    };
  }, [selectedPersonnel, customerJobs, personnelPayments, filters]);

  const setDateRange = (period: 'this_month' | 'last_month' | 'all') => {
    if (period === 'all') {
        setFilters({ startDate: '', endDate: '' });
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
    setFilters({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] });
  };


  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isEditable = currentUser.role === Role.ADMIN;
  const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  return (
    <>
    <div className="flex flex-col md:flex-row h-full gap-6">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center"><UserGroupIcon className="h-6 w-6 mr-2 text-blue-500" />Personel Listesi</h3>
          {isEditable && <button onClick={handleOpenAddModal} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800" aria-label="Yeni Personel Ekle"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>}
        </div>
        <div className="p-2 border-b">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div>
                <input type="text" placeholder="Personel ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
        </div>
        <div className="overflow-y-auto flex-1 max-h-80 md:max-h-none">
            {filteredPersonnel.length > 0 ? (
                <ul>{filteredPersonnel.map(p => {
                    return (
                        <li key={p.id}><button onClick={() => handleSelectPersonnel(p)} className={`w-full text-left p-4 transition-colors duration-150 ${selectedPersonnel?.id === p.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                            <p className="font-semibold text-gray-800">{p.name}</p>
                        </button></li>
                    );
                })}</ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    {personnel.length > 0 && searchQuery ? (
                        <><MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-2"/><p className="text-gray-500 font-medium">Sonuç Bulunamadı</p><p className="text-sm text-gray-400">'{searchQuery}' için personel bulunamadı.</p></>
                    ) : (
                        <><UserGroupIcon className="h-12 w-12 text-gray-300 mb-2"/><p className="text-gray-500 font-medium">Personel Bulunmuyor</p><p className="text-sm text-gray-400">Başlamak için yeni bir personel ekleyin.</p></>
                    )}
                </div>
            )}
        </div>
      </div>
      <div className="w-full md:w-2/3 lg:w-3/4">
        {selectedPersonnel ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><IdentificationIcon className="h-7 w-7 mr-3 text-blue-500"/>{selectedPersonnel.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">Genel bakiye ve hakediş özeti</p>
                  </div>
                   {isEditable && <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEditModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"><PencilIcon className="h-4 w-4 mr-2" />Düzenle</button>
                        <button onClick={() => handleOpenDeleteModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"><TrashIcon className="h-4 w-4 mr-2" />Sil</button>
                   </div>}
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Toplam Hakediş" value={formatCurrency(totalPaymentDue)} icon={TrendingUpIcon} color="green" />
                <StatCard title="Toplam Ödenen" value={formatCurrency(totalPaid)} icon={TrendingDownIcon} color="red" />
                <StatCard title="Kalan Bakiye" value={formatCurrency(balance)} icon={BanknotesIcon} color={balance >= 0 ? 'blue' : 'red'} />
              </div>
            </div>
            
             <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Finansal Döküm</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                        <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className={commonInputClass} />
                        <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className={commonInputClass} />
                        <button onClick={() => setDateRange('this_month')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Bu Ay</button>
                        <button onClick={() => setDateRange('all')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Tümü</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-700">Yapılan Ödemeler</h3>
                            {isEditable && <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><CreditCardIcon className="h-4 w-4 mr-2" />Ödeme Ekle</button>}
                        </div>
                        <div className="bg-gray-50 rounded-lg border flex-1 overflow-y-auto min-h-[150px]">
                            {payments.length > 0 ? (
                                <ul className="divide-y divide-gray-200">{payments.map(p => {
                                    const job = customerJobs.find(j => j.id === p.customerJobId);
                                    return (
                                    <li key={p.id} className="p-3 flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium text-gray-800">{formatCurrency(p.amount)}</p>
                                            <p className="text-xs text-gray-500">{formatDateTime(p.date)}</p>
                                            {job && <p className="text-xs text-blue-600 mt-1">{job.location}</p>}
                                        </div>
                                        {isEditable && <button onClick={() => setPaymentToDelete(p)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><TrashIcon className="h-4 w-4" /></button>}
                                    </li>
                                );
                                })}</ul>
                            ) : ( <p className="p-4 text-center text-sm text-gray-500">Filtrelenmiş ödeme bulunmuyor.</p> )}
                        </div>
                    </div>
                     <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Çalıştığı İşler ve Hakedişleri</h3>
                        <div className="bg-gray-50 rounded-lg border flex-1 overflow-y-auto min-h-[150px]">
                             {jobs.length > 0 ? (
                                <ul className="divide-y divide-gray-200">{jobs.map(job => {
                                    const earning = job.personnelPayments.find(p=>p.personnelId === selectedPersonnel.id)?.payment || 0;
                                    const customer = customers.find(c => c.id === job.customerId);
                                    return (
                                        <li key={job.id}>
                                            <button onClick={() => handleOpenJobDetails(job)} className="p-3 w-full text-left hover:bg-gray-100 rounded-md transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{job.location}</p>
                                                        <p className="text-xs text-gray-500">{customer?.name} - {job.description}</p>
                                                    </div>
                                                    <p className="font-semibold text-blue-600">{formatCurrency(earning)}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}</ul>
                            ) : ( 
                                <div className="p-4 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                                    <BriefcaseIcon className="h-8 w-8 text-gray-300 mb-2"/>
                                    <span>Filtrelenmiş iş kaydı bulunmuyor.</span>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md">
             <UserGroupIcon className="h-16 w-16 text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Personel Seçilmedi</p><p className="text-gray-400">Detayları görmek için bir personel seçin veya yeni personel ekleyin.</p>
          </div>
        )}
      </div>
    </div>
    <PersonnelEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePersonnel} personnelToEdit={personnelToEdit} />
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Personeli Sil" message={`'${personnelToDelete?.name}' adlı personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}/>
    {selectedPersonnel && isEditable && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleAddPayment} personnel={selectedPersonnel} personnelJobs={jobs}/>}
    <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={handleConfirmDeletePayment} title="Ödemeyi Sil" message={`${paymentToDelete ? formatDateTime(paymentToDelete.date) : ''} tarihli ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`}/>
    <JobPaymentDetailsModal 
        isOpen={jobDetailsModalOpen}
        onClose={() => setJobDetailsModalOpen(false)}
        job={selectedJobForDetails}
        personnel={personnel}
        customer={customers.find(c => c.id === selectedJobForDetails?.customerId)}
    />
    </>
  );
};

export default PersonnelView;