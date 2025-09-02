import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, WorkDay, User, Role, PersonnelPayment } from '../types';
import Calendar from './Calendar';
import { UserGroupIcon, IdentificationIcon, CashIcon, ClockIcon, MapPinIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CreditCardIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';

interface PersonnelViewProps {
  currentUser: User;
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  personnelPayments: PersonnelPayment[];
  onAddWorkDay: (workDay: Omit<WorkDay, 'id'>) => void;
  onUpdateWorkDay: (workDay: WorkDay) => void;
  onDeleteWorkDay: (workDayId: string) => void;
  onAddPersonnel: (personnel: Omit<Personnel, 'id'>) => void;
  onUpdatePersonnel: (personnel: Personnel) => void;
  onDeletePersonnel: (personnelId: string) => void;
  onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
  onDeletePersonnelPayment: (paymentId: string) => void;
}

const WorkDayEditor: React.FC<{
    selectedDate: string;
    selectedPersonnel: Personnel;
    existingWorkDay: WorkDay | undefined;
    onAdd: (workDay: Omit<WorkDay, 'id'>) => void;
    onUpdate: (workDay: WorkDay) => void;
    onDelete: (workDayId: string) => void;
    isEditable: boolean;
    onClose: () => void;
}> = ({ selectedDate, selectedPersonnel, existingWorkDay, onAdd, onUpdate, onDelete, isEditable, onClose }) => {
    
    const [location, setLocation] = useState(existingWorkDay?.location || '');
    const [jobDescription, setJobDescription] = useState(existingWorkDay?.jobDescription || '');
    const [wage, setWage] = useState(existingWorkDay?.wage.toString() || '');
    const [hours, setHours] = useState(existingWorkDay?.hours?.toString() || '8');


    useEffect(() => {
        setLocation(existingWorkDay?.location || '');
        setJobDescription(existingWorkDay?.jobDescription || '');
        setWage(existingWorkDay?.wage.toString() || '');
        setHours(existingWorkDay?.hours?.toString() || '8');
    }, [existingWorkDay]);

    const handleSave = () => {
        const numericWage = parseFloat(wage);
        const numericHours = parseFloat(hours);
        if(isNaN(numericWage) || numericWage <= 0 || isNaN(numericHours) || numericHours <= 0) {
            alert('Lütfen geçerli bir yevmiye ve çalışma saati girin.');
            return;
        }

        if (existingWorkDay) {
            onUpdate({ ...existingWorkDay, location, jobDescription, wage: numericWage, hours: numericHours });
        } else {
            onAdd({ personnelId: selectedPersonnel.id, date: selectedDate, location, jobDescription, wage: numericWage, hours: numericHours });
        }
    };
    
    const handleDelete = () => {
        if(existingWorkDay) {
            onDelete(existingWorkDay.id);
            onClose();
        }
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
             <h3 className="text-lg font-semibold text-gray-800 mb-3">
                İş Detayları - <span className="text-blue-600">{formattedDate}</span>
             </h3>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="wage" className="block text-sm font-medium text-gray-700 mb-1">
                            <CashIcon className="h-4 w-4 inline-block mr-1" />
                            Günlük Yevmiye (₺)
                        </label>
                        <input
                            type="number"
                            id="wage"
                            value={wage}
                            onChange={(e) => setWage(e.target.value)}
                            disabled={!isEditable}
                            placeholder="Örn: 1250"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                        />
                    </div>
                     <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                            <ClockIcon className="h-4 w-4 inline-block mr-1" />
                            Çalışma Saati
                        </label>
                        <input
                            type="number"
                            id="hours"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            disabled={!isEditable}
                            placeholder="Örn: 8"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPinIcon className="h-4 w-4 inline-block mr-1" />
                        Konum
                    </label>
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={!isEditable}
                        placeholder="Örn: Merkez Şantiye"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                    />
                </div>
                <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        <DocumentTextIcon className="h-4 w-4 inline-block mr-1" />
                        İş Tanımı
                    </label>
                    <textarea
                        id="jobDescription"
                        rows={3}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={!isEditable}
                        placeholder="Yapılan işin kısa açıklaması"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                    />
                </div>
                {isEditable && (
                    <div className="flex justify-end items-center gap-3">
                        {existingWorkDay && (
                           <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                               Sil
                           </button>
                        )}
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           {existingWorkDay ? 'Güncelle' : 'Kaydet'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PersonnelEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (personnel: Personnel | Omit<Personnel, 'id'>) => void;
    personnelToEdit: Personnel | null;
    currentUser: User;
    allUsers: User[];
}> = ({ isOpen, onClose, onSave, personnelToEdit, currentUser, allUsers }) => {
    const [name, setName] = useState('');
    const [foremanId, setForemanId] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (personnelToEdit) {
                setName(personnelToEdit.name);
                setForemanId(personnelToEdit.foremanId);
            } else {
                setName('');
                setForemanId(currentUser.role === Role.FOREMAN ? currentUser.id : '');
            }
        }
    }, [isOpen, personnelToEdit, currentUser]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || (currentUser.role === Role.ADMIN && !foremanId)) {
            alert('Lütfen tüm alanları doğru bir şekilde doldurun.');
            return;
        }

        const personnelData = {
            name,
            foremanId
        };
        
        if (personnelToEdit) {
            onSave({ ...personnelToEdit, ...personnelData });
        } else {
            onSave(personnelData);
        }
        onClose();
    };

    const foremen = allUsers.filter(u => u.role === Role.FOREMAN);

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
                    {currentUser.role === Role.ADMIN && (
                        <div>
                            <label htmlFor="foreman-select" className="block text-sm font-medium text-gray-700">Bağlı Olduğu Ustabaşı</label>
                            <select
                                id="foreman-select"
                                value={foremanId}
                                onChange={(e) => setForemanId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="" disabled>Ustabaşı Seçin...</option>
                                {foremen.map(foreman => (
                                    <option key={foreman.id} value={foreman.id}>{foreman.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
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
    onSave: (amount: number) => void;
    personnel: Personnel;
}> = ({ isOpen, onClose, onSave, personnel }) => {
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (!isOpen) setAmount('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen geçerli bir ödeme tutarı girin.');
            return;
        }
        onSave(numericAmount);
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
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PersonnelView: React.FC<PersonnelViewProps> = ({ currentUser, users, personnel, workDays, personnelPayments, onAddWorkDay, onUpdateWorkDay, onDeleteWorkDay, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onAddPersonnelPayment, onDeletePersonnelPayment }) => {
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(personnel.length > 0 ? personnel[0] : null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);

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

  useEffect(() => {
    setSelectedDate(null);
    setViewDate(new Date());
  }, [selectedPersonnel]);


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

  const handleAddPayment = (amount: number) => {
    if(selectedPersonnel) {
        onAddPersonnelPayment({
            personnelId: selectedPersonnel.id,
            amount,
            date: new Date().toISOString()
        });
    }
  };

  const { selectedPersonnelWorkDays, totalPaymentDue, totalPaid, balance, monthlyPayments } = useMemo(() => {
    if (!selectedPersonnel) return { selectedPersonnelWorkDays: [], totalPaymentDue: 0, totalPaid: 0, balance: 0, monthlyPayments: [] };
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    
    const workDaysForPersonnel = workDays.filter(wd => {
        const workDate = new Date(wd.date);
        return wd.personnelId === selectedPersonnel.id && workDate.getMonth() === viewMonth && workDate.getFullYear() === viewYear;
    });

    const paymentsForPersonnel = personnelPayments.filter(pp => {
        const paymentDate = new Date(pp.date);
        return pp.personnelId === selectedPersonnel.id && paymentDate.getMonth() === viewMonth && paymentDate.getFullYear() === viewYear;
    });

    const due = workDaysForPersonnel.reduce((sum, wd) => sum + wd.wage, 0);
    const paid = paymentsForPersonnel.reduce((sum, pp) => sum + pp.amount, 0);
    
    return {
        selectedPersonnelWorkDays: workDaysForPersonnel,
        totalPaymentDue: due,
        totalPaid: paid,
        balance: due - paid,
        monthlyPayments: paymentsForPersonnel.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [selectedPersonnel, workDays, personnelPayments, viewDate]);
  
  const workDayForSelectedDate = useMemo(() => {
      if (!selectedDate || !selectedPersonnel) return undefined;
      return selectedPersonnelWorkDays.find(wd => wd.date === selectedDate);
  }, [selectedDate, selectedPersonnelWorkDays]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const isEditable = currentUser.role === Role.ADMIN || (currentUser.role === Role.FOREMAN && selectedPersonnel?.foremanId === currentUser.id);

  return (
    <>
    <div className="flex flex-col md:flex-row h-full gap-6">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center"><UserGroupIcon className="h-6 w-6 mr-2 text-blue-500" />Personel Listesi</h3>
          {currentUser.role === Role.ADMIN && <button onClick={handleOpenAddModal} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800" aria-label="Yeni Personel Ekle"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>}
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
                    const foremanName = users.find(u => u.id === p.foremanId)?.name;
                    return (
                        <li key={p.id}><button onClick={() => handleSelectPersonnel(p)} className={`w-full text-left p-4 transition-colors duration-150 ${selectedPersonnel?.id === p.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                            <p className="font-semibold text-gray-800">{p.name}</p>
                            {foremanName && <p className="text-xs text-gray-500">{foremanName}</p>}
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
      <div className="w-full md:w-2/3 lg:w-3-4">
        {selectedPersonnel ? (
          <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <div className="border-b pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><IdentificationIcon className="h-7 w-7 mr-3 text-blue-500"/>{selectedPersonnel.name}</h2>
                   {isEditable && <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEditModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"><PencilIcon className="h-4 w-4 mr-2" />Düzenle</button>
                        <button onClick={() => handleOpenDeleteModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"><TrashIcon className="h-4 w-4 mr-2" />Sil</button>
                   </div>}
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Çalışılan Gün</p><p className="text-lg font-bold text-gray-800">{selectedPersonnelWorkDays.length}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Aylık Hakediş</p><p className="text-lg font-bold text-gray-800">{formatCurrency(totalPaymentDue)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Ödenen Tutar</p><p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Kalan Bakiye</p><p className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-blue-600'}`}>{formatCurrency(balance)}</p></div>
              </div>
            </div>
            
            {isEditable && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-700">Aylık Ödemeler</h3>
                        <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><CreditCardIcon className="h-4 w-4 mr-2" />Ödeme Ekle</button>
                    </div>
                    <div className="bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                        {monthlyPayments.length > 0 ? (
                            <ul className="divide-y divide-gray-200">{monthlyPayments.map(p => (
                                <li key={p.id} className="p-3 flex justify-between items-center group">
                                    <div><p className="font-medium text-gray-800">{formatCurrency(p.amount)}</p><p className="text-xs text-gray-500">{formatDateTime(p.date)}</p></div>
                                    <button onClick={() => setPaymentToDelete(p)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><TrashIcon className="h-4 w-4" /></button>
                                </li>
                            ))}</ul>
                        ) : ( <p className="p-4 text-center text-sm text-gray-500">Bu ay hiç ödeme yapılmadı.</p> )}
                    </div>
                </div>
            )}

            <div className="flex-1">
              <Calendar displayDate={viewDate} onMonthChange={setViewDate} workDays={selectedPersonnelWorkDays} onDayClick={(date) => setSelectedDate(date)} selectedDate={selectedDate}/>
              {selectedDate && (
                <WorkDayEditor selectedDate={selectedDate} selectedPersonnel={selectedPersonnel} existingWorkDay={workDayForSelectedDate} onAdd={onAddWorkDay} onUpdate={onUpdateWorkDay} onDelete={onDeleteWorkDay} isEditable={isEditable} onClose={() => setSelectedDate(null)}/>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md">
             <UserGroupIcon className="h-16 w-16 text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Personel Seçilmedi</p><p className="text-gray-400">Detayları görmek için bir personel seçin veya yeni personel ekleyin.</p>
          </div>
        )}
      </div>
    </div>
    <PersonnelEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePersonnel} personnelToEdit={personnelToEdit} currentUser={currentUser} allUsers={users}/>
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Personeli Sil" message={`'${personnelToDelete?.name}' adlı personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}/>
    {selectedPersonnel && isEditable && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleAddPayment} personnel={selectedPersonnel} />}
    <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={handleConfirmDeletePayment} title="Ödemeyi Sil" message={`${paymentToDelete ? formatDateTime(paymentToDelete.date) : ''} tarihli ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`}/>
    </>
  );
};

export default PersonnelView;