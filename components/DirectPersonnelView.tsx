import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, WorkDay, User, PersonnelPayment } from '../types';
import Calendar from './Calendar';
import { UserIcon, IdentificationIcon, CashIcon, CalendarIcon, MapPinIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, MagnifyingGlassIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';

interface DirectPersonnelViewProps {
  currentUser: User;
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

// Sub-components remain the same as they are generic enough
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


    useEffect(() => {
        setLocation(existingWorkDay?.location || '');
        setJobDescription(existingWorkDay?.jobDescription || '');
        setWage(existingWorkDay?.wage.toString() || '');
    }, [existingWorkDay]);

    const handleSave = () => {
        const numericWage = parseFloat(wage);
        if(isNaN(numericWage) || numericWage <= 0) {
            alert('Lütfen geçerli bir yevmiye tutarı girin.');
            return;
        }

        if (existingWorkDay) {
            onUpdate({ ...existingWorkDay, location, jobDescription, wage: numericWage });
        } else {
            onAdd({ personnelId: selectedPersonnel.id, date: selectedDate, location, jobDescription, wage: numericWage });
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
}> = ({ isOpen, onClose, onSave, personnelToEdit, currentUser }) => {
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
            alert('Lütfen isim alanını doldurun.');
            return;
        }

        const personnelData = {
            name,
            foremanId: currentUser.id
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

const DirectPersonnelView: React.FC<DirectPersonnelViewProps> = ({ currentUser, personnel, workDays, personnelPayments, onAddWorkDay, onUpdateWorkDay, onDeleteWorkDay, onAddPersonnel, onUpdatePersonnel, onDeletePersonnel, onAddPersonnelPayment, onDeletePersonnelPayment }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const personnelDetails = useMemo(() => {
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    
    return personnel.map(p => {
        const monthlyWorkDays = workDays.filter(wd => {
            const workDate = new Date(wd.date);
            return wd.personnelId === p.id && workDate.getMonth() === viewMonth && workDate.getFullYear() === viewYear;
        });

        const monthlyPayments = personnelPayments.filter(pp => {
            const paymentDate = new Date(pp.date);
            return pp.personnelId === p.id && paymentDate.getMonth() === viewMonth && paymentDate.getFullYear() === viewYear;
        });

        const totalDue = monthlyWorkDays.reduce((sum, wd) => sum + wd.wage, 0);
        const totalPaid = monthlyPayments.reduce((sum, pp) => sum + pp.amount, 0);
        const balance = totalDue - totalPaid;

        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (totalDue > 0) {
            if (balance <= 0) paymentStatus = 'paid';
            else if (totalPaid > 0) paymentStatus = 'partial';
        } else {
            paymentStatus = 'paid'; // No earnings, so nothing to pay
        }

        return {
            ...p,
            totalDue,
            totalPaid,
            balance,
            paymentStatus,
            monthlyPayments: monthlyPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        }
    });
  }, [personnel, workDays, personnelPayments, viewDate]);
  
  const filteredPersonnel = useMemo(() => {
    if (!searchQuery) return personnelDetails;
    return personnelDetails.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [personnelDetails, searchQuery]);
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<typeof filteredPersonnel[0] | null>(filteredPersonnel.length > 0 ? filteredPersonnel[0] : null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);

  useEffect(() => {
    const newSelected = filteredPersonnel.find(p => p.id === selectedPersonnel?.id);
    setSelectedPersonnel(newSelected || (filteredPersonnel.length > 0 ? filteredPersonnel[0] : null));
  }, [filteredPersonnel, selectedPersonnel?.id]);

  useEffect(() => {
    setSelectedDate(null);
    setViewDate(new Date());
  }, [selectedPersonnel?.id]);


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

  const handleSavePersonnel = (data: Personnel | Omit<Personnel, 'id'>) => {
    if ('id' in data) onUpdatePersonnel(data);
    else onAddPersonnel(data);
  };
  
  const handleSelectPersonnel = (p: typeof personnelDetails[0]) => {
    if (selectedPersonnel?.id !== p.id) setSelectedPersonnel(p);
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
  
  const handleConfirmDeletePayment = () => {
      if(paymentToDelete) {
          onDeletePersonnelPayment(paymentToDelete.id);
          setPaymentToDelete(null);
      }
  };

  const selectedPersonnelWorkDays = useMemo(() => {
    if (!selectedPersonnel) return [];
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    return workDays.filter(wd => {
        const workDate = new Date(wd.date);
        return wd.personnelId === selectedPersonnel.id && workDate.getMonth() === viewMonth && workDate.getFullYear() === viewYear;
    });
  }, [selectedPersonnel, workDays, viewDate]);
  
  const workDayForSelectedDate = useMemo(() => {
      if (!selectedDate || !selectedPersonnel) return undefined;
      return selectedPersonnelWorkDays.find(wd => wd.date === selectedDate);
  }, [selectedDate, selectedPersonnelWorkDays]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusInfo = {
    paid: { color: 'bg-green-500', text: 'Ödendi' },
    partial: { color: 'bg-yellow-500', text: 'Kısmi Ödendi' },
    unpaid: { color: 'bg-red-500', text: 'Ödenmedi' },
  };

  return (
    <>
    <div className="flex flex-col md:flex-row h-full gap-6">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center"><UserIcon className="h-6 w-6 mr-2 text-blue-500" /> Şahsi Ekip</h3>
          <button onClick={handleOpenAddModal} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>
        </div>
        <div className="p-2 border-b">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Personel ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>
        <div className="overflow-y-auto flex-1">
            {filteredPersonnel.length > 0 ? (
                <ul>{filteredPersonnel.map(p => (
                    <li key={p.id}>
                    <button onClick={() => handleSelectPersonnel(p)} className={`w-full text-left p-4 transition-colors duration-150 ${selectedPersonnel?.id === p.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800">{p.name}</p>
                            <div className="flex items-center">
                                <span className="text-xs mr-2 text-gray-500">{statusInfo[p.paymentStatus].text}</span>
                                <div className={`w-3 h-3 rounded-full ${statusInfo[p.paymentStatus].color}`}></div>
                            </div>
                        </div>
                        <p className={`text-xs mt-1 ${p.balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                           Bakiye: <span className="font-medium">{formatCurrency(p.balance)}</span>
                        </p>
                    </button>
                    </li>
                ))}</ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    {personnelDetails.length > 0 && searchQuery ? (
                        <>
                            <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-2"/>
                            <p className="text-gray-500 font-medium">Sonuç Bulunamadı</p>
                            <p className="text-sm text-gray-400">'{searchQuery}' için personel bulunamadı.</p>
                        </>
                    ) : (
                        <>
                            <UserIcon className="h-12 w-12 text-gray-300 mb-2"/>
                            <p className="text-gray-500 font-medium">Personel Bulunmuyor</p>
                            <p className="text-sm text-gray-400">Başlamak için yeni bir personel ekleyin.</p>
                        </>
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
                   <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEditModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"><PencilIcon className="h-4 w-4 mr-2" />Düzenle</button>
                        <button onClick={() => handleOpenDeleteModal(selectedPersonnel)} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"><TrashIcon className="h-4 w-4 mr-2" />Sil</button>
                   </div>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-500">Aylık Hakediş</p><p className="text-lg font-bold text-gray-800">{formatCurrency(selectedPersonnel.totalDue)}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-500">Ödenen Tutar</p><p className="text-lg font-bold text-green-600">{formatCurrency(selectedPersonnel.totalPaid)}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-500">Kalan Bakiye</p><p className={`text-lg font-bold ${selectedPersonnel.balance > 0 ? 'text-red-600' : 'text-blue-600'}`}>{formatCurrency(selectedPersonnel.balance)}</p></div>
              </div>
            </div>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Aylık Ödemeler</h3>
                    <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><CreditCardIcon className="h-4 w-4 mr-2" />Ödeme Ekle</button>
                </div>
                <div className="bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                    {selectedPersonnel.monthlyPayments.length > 0 ? (
                        <ul className="divide-y divide-gray-200">{selectedPersonnel.monthlyPayments.map(p => (
                            <li key={p.id} className="p-3 flex justify-between items-center group">
                                <div><p className="font-medium text-gray-800">{formatCurrency(p.amount)}</p><p className="text-xs text-gray-500">{formatDateTime(p.date)}</p></div>
                                <button onClick={() => setPaymentToDelete(p)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><TrashIcon className="h-4 w-4" /></button>
                            </li>
                        ))}</ul>
                    ) : ( <p className="p-4 text-center text-sm text-gray-500">Bu ay hiç ödeme yapılmadı.</p> )}
                </div>
            </div>
            <div className="flex-1">
              <Calendar displayDate={viewDate} onMonthChange={setViewDate} workDays={selectedPersonnelWorkDays} onDayClick={(date) => setSelectedDate(date)} selectedDate={selectedDate}/>
              {selectedDate && (
                <WorkDayEditor selectedDate={selectedDate} selectedPersonnel={selectedPersonnel} existingWorkDay={workDayForSelectedDate} onAdd={onAddWorkDay} onUpdate={onUpdateWorkDay} onDelete={onDeleteWorkDay} isEditable={true} onClose={() => setSelectedDate(null)}/>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md">
             <UserIcon className="h-16 w-16 text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Personel Seçilmedi</p><p className="text-gray-400">Detayları görmek için bir personel seçin veya yeni personel ekleyin.</p>
          </div>
        )}
      </div>
    </div>
    <PersonnelEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePersonnel} personnelToEdit={personnelToEdit} currentUser={currentUser}/>
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Personeli Sil" message={`'${personnelToDelete?.name}' adlı personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}/>
    {selectedPersonnel && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleAddPayment} personnel={selectedPersonnel} />}
    <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={handleConfirmDeletePayment} title="Ödemeyi Sil" message={`${paymentToDelete ? formatDateTime(paymentToDelete.date) : ''} tarihli ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`}/>
    </>
  );
};

export default DirectPersonnelView;