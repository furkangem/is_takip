
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
// FIX: Import Payer and PaymentMethod types.
import { Personnel, User, Role, PersonnelPayment, CustomerJob, Customer, Payer, PaymentMethod } from '../types';
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CreditCardIcon, XMarkIcon, BriefcaseIcon, BanknotesIcon, TrendingUpIcon, TrendingDownIcon, ClipboardDocumentListIcon, CurrencyDollarIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });


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
        
        // Güçlü validation
        if (!name || name.trim() === '') {
            alert('Personel adı boş bırakılamaz!');
            return;
        }
        
        if (name.trim().length < 2) {
            alert('Personel adı en az 2 karakter olmalıdır!');
            return;
        }

        const personnelData = {
            name: name.trim(), // Boşlukları temizle
        };
        
        console.log('Form\'dan gönderilen veri:', personnelData); // Debug için
        
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
    // FIX: Update onSave to include payer, paymentMethod and date.
    onSave: (paymentData: {amount: number, jobId?: number, payer: Payer, paymentMethod: PaymentMethod, date: string}) => void;
    personnel: Personnel;
    personnelJobs: CustomerJob[];
}> = ({ isOpen, onClose, onSave, personnel, personnelJobs }) => {
    const [amount, setAmount] = useState('');
    const [jobId, setJobId] = useState<string>('');
    // FIX: Add state for payer and paymentMethod.
    const [payer, setPayer] = useState<Payer>('Kasa');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [dateTime, setDateTime] = useState<string>('');

    const formatLocalDateTimeForInput = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };


    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setJobId('');
            // FIX: Reset payer and paymentMethod on close.
            setPayer('Kasa');
            setPaymentMethod('cash');
            setDateTime('');
        } else {
            const now = new Date();
            setDateTime(formatLocalDateTimeForInput(now));
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
        
        let finalDate: string;
        if (!dateTime || dateTime === '') {
            // Eğer tarih seçilmemişse güncel tarih ve saati kullan
            finalDate = new Date().toISOString();
        } else {
            // Eğer tarih seçilmişse, seçilen tarihi al ama saati güncel saat yap
            const selectedDate = new Date(dateTime);
            const now = new Date();
            // Seçilen tarihi koru, sadece saati güncel yap
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            finalDate = selectedDate.toISOString();
        }
        
        // FIX: Pass payer, paymentMethod and date to onSave.
        onSave({amount: numericAmount, jobId: jobId ? Number(jobId) : undefined, payer, paymentMethod, date: finalDate});
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
                        <label htmlFor="date-time" className="block text-sm font-medium text-gray-700">Tarih (Opsiyonel)</label>
                        <input
                            type="date"
                            id="date-time"
                            value={dateTime ? dateTime.split('T')[0] : ''}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setDateTime(e.target.value + 'T00:00');
                                } else {
                                    setDateTime('');
                                }
                            }}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tarih seçilmezse güncel tarih ve saat kullanılır</p>
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
                    {/* FIX: Add inputs for payer and paymentMethod. */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="payer" className="block text-sm font-medium text-gray-700">Ödeyen</label>
                            <select
                                id="payer"
                                value={payer}
                                onChange={(e) => setPayer(e.target.value as Payer)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Kasa">Kasa</option>
                                <option value="Omer">Ömer</option>
                                <option value="Baris">Barış</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                            <select
                                id="paymentMethod"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="cash">Nakit</option>
                                <option value="transfer">Havale</option>
                                <option value="card">Kart</option>
                            </select>
                        </div>
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

interface PersonnelViewProps {
  currentUser: User;
  users: User[];
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnelPayments: PersonnelPayment[];
  onAddPersonnel: (personnel: Omit<Personnel, 'id'>) => void;
  onUpdatePersonnel: (personnel: Personnel) => void;
  onDeletePersonnel: (personnelId: number) => void;
  onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
  onDeletePersonnelPayment: (paymentId: number) => void;
  navigateToId: number | null;
  onNavigationComplete: () => void;
}

const PersonnelView: React.FC<PersonnelViewProps> = ({ currentUser, users, personnel, customers, customerJobs, personnelPayments, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onAddPersonnelPayment, onDeletePersonnelPayment, navigateToId, onNavigationComplete }) => {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(personnel.length > 0 ? personnel[0].id : null);
  const selectedPersonnel = useMemo(() => 
    personnel.find(p => p.id === selectedPersonnelId) || null
  , [personnel, selectedPersonnelId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);
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
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<CustomerJob | null>(null);
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (selectedPersonnel) {
        setNoteText(selectedPersonnel.note?.text || '');
        setIsNoteEditing(false);
    }
  }, [selectedPersonnel]);

  const handleNoteSave = () => {
    if (selectedPersonnel) {
        onUpdatePersonnel({
            ...selectedPersonnel,
            note: {
                text: noteText,
                updatedAt: new Date().toISOString(),
            }
        });
        setIsNoteEditing(false);
    }
  };


  useEffect(() => {
    if (navigateToId != null) {
        const person = personnel.find(p => p.id === navigateToId);
        if (person) {
            setSelectedPersonnelId(person.id);
            setSearchQuery('');
        }
        onNavigationComplete();
    }
  }, [navigateToId, personnel, onNavigationComplete]);

  const filteredPersonnel = useMemo(() => {
    let filtered = personnel;
    if (searchQuery) {
      filtered = personnel.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // En yeni kayıtlar üstte olacak şekilde ID'ye göre sırala
    return filtered.sort((a, b) => b.id - a.id);
  }, [personnel, searchQuery]);

  // Her personelin kalan bakiyesini hesapla (hakediş - ödenen)
  const personnelBalanceMap = useMemo(() => {
    const map = new Map<number, number>();
    personnel.forEach(person => {
        const personJobs = customerJobs.filter(job => job.personnelIds.includes(person.id));
        const earnings = personJobs.reduce((sum, job) => {
            const earningInfo = job.personnelPayments.find(pp => pp.personnelId === person.id);
            return sum + (earningInfo?.payment || 0);
        }, 0);
        const payments = personnelPayments.filter(pp => pp.personnelId === person.id);
        const totalPaid = payments.reduce((sum, pp) => sum + pp.amount, 0);
        map.set(person.id, earnings - totalPaid);
    });
    return map;
  }, [personnel, customerJobs, personnelPayments]);

  useEffect(() => {
    const isSelectedInList = filteredPersonnel.some(p => p.id === selectedPersonnelId);

    if (selectedPersonnelId && !isSelectedInList) {
        setSelectedPersonnelId(filteredPersonnel.length > 0 ? filteredPersonnel[0].id : null);
    } else if (!selectedPersonnelId && filteredPersonnel.length > 0) {
        setSelectedPersonnelId(filteredPersonnel[0].id);
    }
  }, [filteredPersonnel, selectedPersonnelId]);

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
    } else {
      onAddPersonnel(data);
    }
  };

  const handleSelectPersonnel = (p: Personnel) => {
    if (selectedPersonnelId !== p.id) {
      setSelectedPersonnelId(p.id);
    }
  };

  // FIX: Update function signature to accept payer, paymentMethod and date.
  const handleAddPayment = (paymentData: {amount: number, jobId?: number, payer: Payer, paymentMethod: PaymentMethod, date: string}) => {
    if(selectedPersonnel) {
        // FIX: Add payer and paymentMethod to the new payment object.
        onAddPersonnelPayment({
            personnelId: selectedPersonnel.id,
            amount: paymentData.amount,
            customerJobId: paymentData.jobId,
            date: paymentData.date || new Date().toISOString(),
            payer: paymentData.payer,
            paymentMethod: paymentData.paymentMethod,
        });
    }
  };
  
  const handleOpenJobDetails = (job: CustomerJob) => {
    setSelectedJobForDetails(job);
    setJobDetailsModalOpen(true);
  };

  const { totalPaymentDue, totalPaid, balance, jobs, payments } = useMemo(() => {
    if (!selectedPersonnel) return { totalPaymentDue: 0, totalPaid: 0, balance: 0, jobs: [], payments: [] };
    
    const allPersonnelJobs = customerJobs.filter(job => job.personnelIds.includes(selectedPersonnel.id));
    // FIX: Add explicit type for accumulator `sum` to prevent arithmetic errors.
    const due = allPersonnelJobs.reduce((sum: number, job: CustomerJob) => {
        const personnelEarning = job.personnelPayments.find(p => p.personnelId === selectedPersonnel.id);
        return sum + (personnelEarning?.payment || 0);
    }, 0);
    const allPersonnelPayments = personnelPayments.filter(p => p.personnelId === selectedPersonnel.id);
    // FIX: Add explicit type for accumulator `sum` to prevent arithmetic errors.
    const paid = allPersonnelPayments.reduce((sum: number, p: PersonnelPayment) => sum + p.amount, 0);

    const start = filters.startDate ? new Date(filters.startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if(end) end.setHours(23,59,59,999);

    const dateFilteredJobs = allPersonnelJobs.filter(j => {
        const jobDate = new Date(j.date);
        if(start && jobDate < start) return false;
        if(end && jobDate > end) return false;
        return true;
    });

    const jobsWithNonZeroBalance = dateFilteredJobs.filter(job => {
        const earning = job.personnelPayments.find(p => p.personnelId === selectedPersonnel.id)?.payment || 0;
        const paymentsForThisJob = allPersonnelPayments.filter(p => p.customerJobId === job.id);
        const totalPaidForThisJob = paymentsForThisJob.reduce((sum, p) => sum + p.amount, 0);
        const jobBalance = earning - totalPaidForThisJob;
        return jobBalance !== 0;
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
        jobs: jobsWithNonZeroBalance,
        payments: filteredPayments,
    };
  }, [selectedPersonnel, customerJobs, personnelPayments, filters]);

  const setDateRange = (period: 'this_month' | 'last_month' | 'all' | 'default') => {
    if (period === 'all') {
        setFilters({ startDate: '', endDate: '' });
        return;
    }
    if (period === 'default') {
        const defaultStart = new Date('2023-01-01');
        const today = new Date();
        setFilters({ 
            startDate: defaultStart.toISOString().split('T')[0], 
            endDate: today.toISOString().split('T')[0] 
        });
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


  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
  const isEditable = currentUser.role === Role.SUPER_ADMIN;
  const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  return (
    <>
    <div className="flex flex-col md:flex-row h-full gap-6">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-gray-800"><UserGroupIcon className="h-6 w-6 mr-2 text-blue-500" />Personel Listesi</h3>
          {isEditable && <button onClick={handleOpenAddModal} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800" aria-label="Yeni Personel Ekle"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>}
        </div>
        <div className="p-2 border-b">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div>
                <input type="text" placeholder="Personel ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"/>
            </div>
        </div>
        <div className="overflow-y-auto flex-1 max-h-80 md:max-h-none">
            {filteredPersonnel.length > 0 ? (
                <ul>{filteredPersonnel.map(p => {
                    return (
                        <li key={p.id}><button onClick={() => handleSelectPersonnel(p)} className={`w-full text-left p-4 transition-colors duration-150 ${selectedPersonnel?.id === p.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                            <p className="font-semibold text-gray-800 flex items-center justify-between">
                                <span>{p.name || 'İsimsiz'}</span>
                                {((personnelBalanceMap.get(p.id) || 0) > 0) && (
                                    <span
                                        className="ml-3 inline-block h-1 w-10 rounded-full bg-red-500 animate-pulse opacity-80 motion-reduce:animate-none"
                                        title={`Kalan: ${formatCurrency(personnelBalanceMap.get(p.id) || 0)}`}
                                    />
                                )}
                            </p>
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
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                        <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-blue-600"/>
                        {selectedPersonnel.name || 'İsimsiz'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Genel bakiye ve hakediş özeti</p>
                  </div>
                   {isEditable && <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => handleOpenEditModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg shadow-sm transition-colors"><PencilIcon className="h-4 w-4 mr-2" />Düzenle</button>
                        <button onClick={() => handleOpenDeleteModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg shadow-sm transition-colors"><TrashIcon className="h-4 w-4 mr-2" />Sil</button>
                   </div>}
                </div>
                 <div className="border-t mt-4 pt-4">
                    {isEditable && isNoteEditing ? (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Personel Notu</label>
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                                <button onClick={() => setIsNoteEditing(false)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm">İptal</button>
                                <button onClick={handleNoteSave} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Kaydet</button>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => isEditable && setIsNoteEditing(true)} className={isEditable ? 'cursor-pointer' : ''}>
                            <p className="text-sm font-medium text-gray-700">Personel Notu</p>
                            {selectedPersonnel.note?.text ? (
                                <div className="mt-1 text-sm text-gray-600">
                                    <p className="whitespace-pre-wrap">{selectedPersonnel.note.text}</p>
                                    <p className="text-xs text-gray-400 mt-2 text-right">
                                        Son Güncelleme: {formatDateTime(selectedPersonnel.note.updatedAt)}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm italic text-gray-400">
                                    {isEditable ? 'Not eklemek için tıklayın...' : 'Not bulunmuyor.'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Toplam Hakediş" value={formatCurrency(totalPaymentDue)} icon={TrendingUpIcon} color="green" />
                <StatCard title="Toplam Ödenen" value={formatCurrency(totalPaid)} icon={TrendingDownIcon} color="red" />
                <StatCard title="Kalan Bakiye" value={formatCurrency(balance)} icon={CurrencyDollarIcon} color="blue" />
            </div>
            
             <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Finansal Döküm</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end">
                        <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className={commonInputClass} />
                        <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className={commonInputClass} />
                        <button onClick={() => setDateRange('default')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Varsayılan</button>
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
                                    const paymentsForThisJob = personnelPayments.filter(p => p.personnelId === selectedPersonnel.id && p.customerJobId === job.id);
                                    const totalPaidForThisJob = paymentsForThisJob.reduce((sum, p) => sum + p.amount, 0);
                                    const jobBalance = earning - totalPaidForThisJob;
                                    const balanceColor = jobBalance > 0 ? 'text-blue-600' : (jobBalance < 0 ? 'text-red-600' : 'text-green-700');

                                    return (
                                        <li key={job.id}>
                                            <button onClick={() => handleOpenJobDetails(job)} className="p-3 w-full text-left hover:bg-gray-100 rounded-md transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <p className="font-medium text-gray-800">{job.location}</p>
                                                            <p className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">{formatDate(job.date)}</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{customer?.name} - {job.description}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 min-w-[100px]">
                                                        <p className={`font-bold text-lg ${balanceColor}`} title="Kalan Bakiye">
                                                            {formatCurrency(jobBalance)}
                                                        </p>
                                                        <p className="text-xs text-gray-500" title="Toplam Hakediş">
                                                            Hakediş: {formatCurrency(earning)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}</ul>
                            ) : ( 
                                <div className="p-4 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                                    <BriefcaseIcon className="h-8 w-8 text-gray-300 mb-2"/>
                                    <span>{filters.startDate || filters.endDate ? "Filtrelenmiş iş kaydı bulunmuyor." : "Bu personel için hakedişli iş kaydı bulunmuyor."}</span>
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
    <Suspense fallback={null}>
        {isModalOpen && <PersonnelEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePersonnel} personnelToEdit={personnelToEdit} />}
        {isDeleteModalOpen && <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Personeli Sil" message={`'${personnelToDelete?.name}' adlı personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}/>}
        {selectedPersonnel && isEditable && isPaymentModalOpen && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleAddPayment} personnel={selectedPersonnel} personnelJobs={jobs}/>}
        {paymentToDelete && <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={handleConfirmDeletePayment} title="Ödemeyi Sil" message={`${paymentToDelete ? formatDateTime(paymentToDelete.date) : ''} tarihli ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`}/>}
        {jobDetailsModalOpen && <JobPaymentDetailsModal 
            isOpen={jobDetailsModalOpen}
            onClose={() => setJobDetailsModalOpen(false)}
            job={selectedJobForDetails}
            personnel={personnel}
            customer={customers.find(c => c.id === selectedJobForDetails?.customerId)}
        />}
    </Suspense>
    </>
  );
};

export default PersonnelView;