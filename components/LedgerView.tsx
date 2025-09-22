


import React, { useState, useMemo, useEffect } from 'react';
import { DefterEntry, SharedExpense, Payer, PaymentMethod, PersonnelPayment, Customer, CustomerJob, Personnel } from '../types';
import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon, BanknotesIcon, BriefcaseIcon, DocumentCheckIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CashIcon, CreditCardIcon, ArrowsRightLeftIcon, TrendingUpIcon, TrendingDownIcon, ChevronRightIcon, ArrowLeftIcon, UserGroupIcon, CalendarIcon, ChevronDownIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';

// #region Helper Functions and Constants
const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
const formatDateTime = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const paymentMethodIcons: Record<PaymentMethod, React.ElementType> = { cash: CashIcon, card: CreditCardIcon, transfer: ArrowsRightLeftIcon };
const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };
// #endregion

// #region MODALS
const DefterEntryEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: DefterEntry | Omit<DefterEntry, 'id'>) => void;
    entryToEdit: DefterEntry | null;
}> = ({ isOpen, onClose, onSave, entryToEdit }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense' as 'income' | 'expense',
        status: 'unpaid' as 'paid' | 'unpaid',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (entryToEdit) {
                setFormData({
                    description: entryToEdit.description,
                    amount: String(entryToEdit.amount),
                    type: entryToEdit.type,
                    status: entryToEdit.status,
                    date: entryToEdit.date,
                    dueDate: entryToEdit.dueDate || '',
                    notes: entryToEdit.notes || ''
                });
            } else {
                setFormData({
                    description: '',
                    amount: '',
                    type: 'expense',
                    status: 'unpaid',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    notes: ''
                });
            }
        }
    }, [isOpen, entryToEdit]);

    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount);
        if (!formData.description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen açıklama ve geçerli bir tutar girin.');
            return;
        }

        const entryData = {
            ...formData,
            amount: numericAmount,
            dueDate: formData.dueDate || undefined,
            notes: formData.notes || undefined,
            paidDate: formData.status === 'paid' ? (entryToEdit?.paidDate || new Date().toISOString().split('T')[0]) : undefined
        };
        
        if (entryToEdit) {
            onSave({ ...entryToEdit, ...entryData });
        } else {
            onSave(entryData);
        }
        onClose();
    };
    
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{entryToEdit ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} required className={commonInputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Tutar (₺)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className={commonInputClass} />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tip</label>
                            <select name="type" value={formData.type} onChange={handleChange} className={commonInputClass}>
                                <option value="expense">Borç / Gider</option>
                                <option value="income">Alacak / Gelir</option>
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">İşlem Tarihi</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={commonInputClass} />
                        </div>
                         <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Vade Tarihi (Opsiyonel)</label>
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className={commonInputClass} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notlar (Opsiyonel)</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} className={commonInputClass} rows={2}></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SharedExpenseEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: SharedExpense | Omit<SharedExpense, 'id'>) => void;
    expenseToEdit: SharedExpense | null;
}> = ({ isOpen, onClose, onSave, expenseToEdit }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        paymentMethod: 'cash' as PaymentMethod,
        payer: 'Kasa' as Payer,
        status: 'paid' as 'paid' | 'unpaid',
    });

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setFormData({
                    description: expenseToEdit.description,
                    amount: String(expenseToEdit.amount),
                    paymentMethod: expenseToEdit.paymentMethod,
                    payer: expenseToEdit.payer,
                    status: expenseToEdit.status,
                });
            } else {
                setFormData({
                    description: '',
                    amount: '',
                    paymentMethod: 'cash',
                    payer: 'Kasa',
                    status: 'paid',
                });
            }
        }
    }, [isOpen, expenseToEdit]);

    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount);
        if (!formData.description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen açıklama ve geçerli bir tutar girin.');
            return;
        }

        const expenseData = {
            ...formData,
            amount: numericAmount,
            date: new Date().toISOString(),
        };
        
        if (expenseToEdit) {
            onSave({ ...expenseToEdit, ...expenseData });
        } else {
            onSave(expenseData);
        }
        onClose();
    };

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{expenseToEdit ? 'Harcamayı Düzenle' : 'Yeni Harcama Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} required className={commonInputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Tutar (₺)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className={commonInputClass} />
                        </div>
                        <div>
                            <label htmlFor="payer" className="block text-sm font-medium text-gray-700">Ödeyen</label>
                            <select name="payer" value={formData.payer} onChange={handleChange} className={commonInputClass}>
                                <option>Kasa</option>
                                <option>Ömer</option>
                                <option>Barış</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={commonInputClass}>
                                <option value="cash">Nakit</option>
                                <option value="card">Kart</option>
                                <option value="transfer">Havale</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Durum</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={commonInputClass}>
                                <option value="paid">Ödendi</option>
                                <option value="unpaid">Ödenmedi</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// #endregion

// #region PersonnelPaymentsView Component and Modals
const AddPersonnelPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: Omit<PersonnelPayment, 'id'>) => void;
    customers: Customer[];
    customerJobs: CustomerJob[];
    personnel: Personnel[];
}> = ({ isOpen, onClose, onSave, customers, customerJobs, personnel }) => {

    const [customerId, setCustomerId] = useState('');
    const [jobId, setJobId] = useState('');
    const [personnelId, setPersonnelId] = useState('');
    const [amount, setAmount] = useState('');
    
    useEffect(() => {
        if (!isOpen) {
            setCustomerId('');
            setJobId('');
            setPersonnelId('');
            setAmount('');
        }
    }, [isOpen]);

    const availableJobs = useMemo(() => {
        if (!customerId) return [];
        return customerJobs.filter(job => job.customerId === customerId);
    }, [customerId, customerJobs]);

    const availablePersonnel = useMemo(() => {
        if (!jobId) return [];
        const job = customerJobs.find(j => j.id === jobId);
        if (!job) return [];
        return personnel.filter(p => job.personnelIds.includes(p.id));
    }, [jobId, customerJobs, personnel]);

    useEffect(() => {
        setJobId('');
        setPersonnelId('');
    }, [customerId]);
    
    useEffect(() => {
        setPersonnelId('');
    }, [jobId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0 || !personnelId) {
            alert('Lütfen tüm alanları doğru bir şekilde doldurun.');
            return;
        }
        onSave({
            personnelId,
            amount: numericAmount,
            customerJobId: jobId,
            date: new Date().toISOString(),
        });
        onClose();
    };
    
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Personel Ödemesi Ekle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="customer" className="block text-sm font-medium text-gray-700">1. Müşteri Seçin</label>
                        <select id="customer" value={customerId} onChange={e => setCustomerId(e.target.value)} required className={commonInputClass}>
                            <option value="" disabled>Müşteri seç...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="job" className="block text-sm font-medium text-gray-700">2. İşi Seçin</label>
                        <select id="job" value={jobId} onChange={e => setJobId(e.target.value)} required className={commonInputClass} disabled={!customerId}>
                            <option value="" disabled>İş seç...</option>
                            {availableJobs.map(j => <option key={j.id} value={j.id}>{j.location} - {j.description}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="personnel" className="block text-sm font-medium text-gray-700">3. Personel Seçin</label>
                        <select id="personnel" value={personnelId} onChange={e => setPersonnelId(e.target.value)} required className={commonInputClass} disabled={!jobId}>
                            <option value="" disabled>Personel seç...</option>
                            {availablePersonnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">4. Ödeme Tutarı (₺)</label>
                        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required className={commonInputClass} disabled={!personnelId} placeholder="Örn: 5000" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={!personnelId || !amount}>Kaydet</button>
                    </div>
                 </form>
            </div>
        </div>
    );
};

const PersonnelPaymentsView: React.FC<{
    personnelPayments: PersonnelPayment[];
    personnel: Personnel[];
    customers: Customer[];
    customerJobs: CustomerJob[];
    onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
    onDeletePersonnelPayment: (paymentId: string) => void;
}> = (props) => {
    const { personnelPayments, personnel, customers, customerJobs, onDeletePersonnelPayment } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);

    const paymentsWithDetails = useMemo(() => {
        return personnelPayments
            .map(p => {
                const person = personnel.find(per => per.id === p.personnelId);
                const job = customerJobs.find(j => j.id === p.customerJobId);
                const customer = job ? customers.find(c => c.id === job.customerId) : undefined;
                return {
                    ...p,
                    personnelName: person?.name || 'Bilinmeyen Personel',
                    jobDescription: job ? `${customer?.name || 'Bilinmeyen Müşteri'} - ${job.location}` : 'Genel Ödeme',
                };
            })
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [personnelPayments, personnel, customers, customerJobs]);

    const handleConfirmDelete = () => {
        if (paymentToDelete) {
            onDeletePersonnelPayment(paymentToDelete.id);
            setPaymentToDelete(null);
        }
    };
    
    return (
        <>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Personel Ödeme Geçmişi</h3>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><PlusIcon className="h-4 w-4 mr-1"/>Ödeme Ekle</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                         <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-3">Tarih</th>
                                <th className="p-3">Personel</th>
                                <th className="p-3">İş</th>
                                <th className="p-3 text-right">Tutar</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200">
                            {paymentsWithDetails.length > 0 ? paymentsWithDetails.map(p => (
                                <tr key={p.id} className="group hover:bg-gray-50">
                                    <td className="p-3 text-gray-600 whitespace-nowrap">{formatDateTime(p.date)}</td>
                                    <td className="p-3 font-medium text-gray-800">{p.personnelName}</td>
                                    <td className="p-3 text-gray-600">{p.jobDescription}</td>
                                    <td className="p-3 font-bold text-gray-900 text-right whitespace-nowrap">{formatCurrency(p.amount)}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => setPaymentToDelete(p)} className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="h-4 w-4"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Henüz personel ödemesi yapılmadı.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AddPersonnelPaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={props.onAddPersonnelPayment} {...props} />
            <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={handleConfirmDelete} title="Ödemeyi Sil" message={`Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`} />
        </>
    );
};
// #endregion

// #region DefterView Component and Modals
const DefterView: React.FC<{
    entries: DefterEntry[];
    onAdd: (entry: Omit<DefterEntry, 'id'>) => void;
    onUpdate: (entry: DefterEntry) => void;
    onDelete: (entryId: string) => void;
}> = ({ entries, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<DefterEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<DefterEntry | null>(null);
    const [showPaidIncomes, setShowPaidIncomes] = useState(false);
    const [showPaidExpenses, setShowPaidExpenses] = useState(false);

    const handleSaveEntry = (data: DefterEntry | Omit<DefterEntry, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data as Omit<DefterEntry, 'id'>) };
    const handleToggleStatus = (entry: DefterEntry) => onUpdate({ ...entry, status: entry.status === 'unpaid' ? 'paid' : 'unpaid', paidDate: entry.status === 'unpaid' ? new Date().toISOString().split('T')[0] : undefined });
    
    const { incomeEntries, expenseEntries } = useMemo(() => {
        const sortLogic = (a: DefterEntry, b: DefterEntry) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime();
        const incomes = entries.filter(e => e.type === 'income');
        const expenses = entries.filter(e => e.type === 'expense');

        return {
            incomeEntries: {
                unpaid: incomes.filter(e => e.status === 'unpaid').sort(sortLogic),
                paid: incomes.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()),
            },
            expenseEntries: {
                unpaid: expenses.filter(e => e.status === 'unpaid').sort(sortLogic),
                paid: expenses.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()),
            },
        };
    }, [entries]);
    
    const totalUnpaidIncome = useMemo(() => incomeEntries.unpaid.reduce((sum, e) => sum + e.amount, 0), [incomeEntries.unpaid]);
    const totalUnpaidExpense = useMemo(() => expenseEntries.unpaid.reduce((sum, e) => sum + e.amount, 0), [expenseEntries.unpaid]);
    
    const EntryListItem: React.FC<{entry: DefterEntry}> = ({entry}) => (
        <li className="p-3 group">
           <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                     <button onClick={() => handleToggleStatus(entry)} className="flex-shrink-0" title={entry.status === 'paid' ? 'Ödenmedi İşaretle' : 'Ödendi İşaretle'}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${entry.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'}`}>
                            {entry.status === 'paid' && <DocumentCheckIcon className="h-3 w-3 text-white"/>}
                        </div>
                    </button>
                    <div className="min-w-0">
                        <p className={`font-semibold truncate ${entry.status === 'paid' ? 'line-through text-gray-500' : 'text-gray-800'}`}>{entry.description}</p>
                        <div className="flex items-center gap-x-4 gap-y-1 text-xs text-gray-500 flex-wrap mt-1">
                             <span className="flex items-center gap-1" title="İşlem Tarihi">
                                <CalendarIcon className="h-3 w-3"/> {formatDate(entry.date)}
                            </span>
                             {entry.dueDate && (
                                <span className="flex items-center gap-1" title="Vade Tarihi">
                                    <CalendarIcon className="h-3 w-3 text-orange-500"/> Vade: {formatDate(entry.dueDate)}
                                </span>
                            )}
                             {entry.paidDate && (
                                <span className="flex items-center gap-1" title="Ödenme Tarihi">
                                    <DocumentCheckIcon className="h-3 w-3 text-green-500"/> Ödendi: {formatDate(entry.paidDate)}
                                </span>
                            )}
                        </div>
                        {entry.notes && <p className="text-xs text-gray-600 mt-1 italic">"{entry.notes}"</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <p className={`font-bold text-base ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(entry.amount)}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setEntryToEdit(entry); setIsModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button>
                        <button onClick={() => setEntryToDelete(entry)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                    </div>
                </div>
           </div>
        </li>
    );

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700">Defter</h2>
                <button onClick={() => { setEntryToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow"><PlusIcon className="h-5 w-5 mr-2"/>Yeni Kayıt</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alacaklar Column */}
                <div className="bg-white rounded-lg shadow-md flex flex-col"><div className="p-4 border-b bg-green-50 rounded-t-lg"><h3 className="text-xl font-semibold text-green-800 flex items-center gap-2"><TrendingUpIcon className="h-6 w-6"/>Alacaklar</h3><p className="text-sm text-green-700 mt-1">Tahsil edilecek toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidIncome)}</span></p></div><div className="flex-grow"><ul className="divide-y divide-gray-200">{incomeEntries.unpaid.length > 0 ? incomeEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş alacak bulunmuyor.</li>}</ul></div>{incomeEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidIncomes(!showPaidIncomes)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Tahsil Edilenler ({incomeEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidIncomes ? 'rotate-180' : ''}`}/></button>{showPaidIncomes && <ul className="divide-y divide-gray-200 bg-gray-50/50">{incomeEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}</div>

                {/* Borçlar Column */}
                <div className="bg-white rounded-lg shadow-md flex flex-col"><div className="p-4 border-b bg-red-50 rounded-t-lg"><h3 className="text-xl font-semibold text-red-800 flex items-center gap-2"><TrendingDownIcon className="h-6 w-6"/>Borçlar / Giderler</h3><p className="text-sm text-red-700 mt-1">Ödenecek toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidExpense)}</span></p></div><div className="flex-grow"><ul className="divide-y divide-gray-200">{expenseEntries.unpaid.length > 0 ? expenseEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş borç bulunmuyor.</li>}</ul></div>{expenseEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidExpenses(!showPaidExpenses)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Ödenenler ({expenseEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidExpenses ? 'rotate-180' : ''}`}/></button>{showPaidExpenses && <ul className="divide-y divide-gray-200 bg-gray-50/50">{expenseEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}</div>
            </div>

            <DefterEntryEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} entryToEdit={entryToEdit} />
            <ConfirmationModal isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={() => { if(entryToDelete) onDelete(entryToDelete.id); setEntryToDelete(null); }} title="Kaydı Sil" message={`'${entryToDelete?.description}' kaydını silmek istediğinizden emin misiniz?`}/>
        </>
    );
}
// #endregion

// #region OrtakKasaView Component and Modals
const OrtakKasaView: React.FC<{
    expenses: SharedExpense[];
    onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
    onUpdate: (expense: SharedExpense) => void;
    onDelete: (expenseId: string) => void;
}> = ({ expenses, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SharedExpense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<SharedExpense | null>(null);
    const [filters, setFilters] = useState({ payer: 'all', status: 'all' });

    const handleFilterChange = (key: 'payer' | 'status', value: string) => setFilters(prev => ({...prev, [key]: value}));
    const handleSaveExpense = (data: SharedExpense | Omit<SharedExpense, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data) };
    const handleToggleStatus = (expense: SharedExpense) => onUpdate({ ...expense, status: expense.status === 'unpaid' ? 'paid' : 'unpaid' });

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(e => (filters.payer === 'all' || e.payer === filters.payer) && (filters.status === 'all' || e.status === filters.status))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, filters]);

    return (
        <>
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-700">Ortak Kasa</h2></div>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b space-y-3"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-800">Bireysel Harcamalar</h3><button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><PlusIcon className="h-4 w-4 mr-1"/>Gider Ekle</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><select value={filters.payer} onChange={e => handleFilterChange('payer', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"><option value="all">Tümünü Ödeyenler</option><option>Kasa</option><option>Ömer</option><option>Barış</option></select><select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"><option value="all">Tüm Durumlar</option><option value="paid">Ödendi</option><option value="unpaid">Ödenmedi</option></select></div>
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[600px]"><thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr><th className="p-3">Durum</th><th className="p-3">Açıklama</th><th className="p-3">Tutar</th><th className="p-3 hidden md:table-cell">Ödeyen</th><th className="p-3 hidden md:table-cell">Yöntem</th><th className="p-3 hidden sm:table-cell">Tarih</th><th className="p-3"></th></tr></thead>
                <tbody className="divide-y divide-gray-200">{filteredExpenses.length > 0 ? filteredExpenses.map(exp => { const PaymentIcon = paymentMethodIcons[exp.paymentMethod]; return (
                    <tr key={exp.id} className="group hover:bg-gray-50"><td className="p-3"><button onClick={() => handleToggleStatus(exp)} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${exp.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{exp.status === 'paid' ? 'Ödendi' : 'Ödenmedi'}</button></td>
                    <td className="p-3 font-medium text-gray-800">{exp.description}</td><td className="p-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                    <td className="p-3 hidden md:table-cell text-gray-600">{exp.payer}</td>
                    <td className="p-3 hidden md:table-cell"><span className="flex items-center gap-1.5 text-gray-600"><PaymentIcon className="h-4 w-4"/> {paymentMethodNames[exp.paymentMethod]}</span></td>
                    <td className="p-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{formatDateTime(exp.date)}</td>
                    <td className="p-3 text-right"><div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => {setExpenseToEdit(exp); setIsModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button><button onClick={() => setExpenseToDelete(exp)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button></div></td></tr>
                );}) : <tr><td colSpan={7} className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td></tr>}</tbody></table></div>
            </div>
            <SharedExpenseEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} expenseToEdit={expenseToEdit} />
            <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if(expenseToDelete) onDelete(expenseToDelete.id); setExpenseToDelete(null); }} title="Gideri Sil" message={`'${expenseToDelete?.description}' giderini silmek istediğinizden emin misiniz?`}/>
        </>
    );
}
// #endregion

// #region Main KasaView (Router)
interface KasaViewProps {
  personnelPayments: PersonnelPayment[];
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  onAddDefterEntry: (entry: Omit<DefterEntry, 'id'>) => void;
  onUpdateDefterEntry: (entry: DefterEntry) => void;
  onDeleteDefterEntry: (entryId: string) => void;
  onAddSharedExpense: (expense: Omit<SharedExpense, 'id'>) => void;
  onUpdateSharedExpense: (expense: SharedExpense) => void;
  onDeleteSharedExpense: (expenseId: string) => void;
  onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
  onDeletePersonnelPayment: (paymentId: string) => void;
}

const KasaView: React.FC<KasaViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'personnel' | 'defter' | 'ortak_kasa'>('personnel');
    
    const tabStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
    const activeTabStyle = "bg-blue-600 text-white";
    const inactiveTabStyle = "text-gray-600 hover:bg-blue-100 hover:text-blue-700";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-700">Kasa Yönetimi</h2>
                <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
                    <button onClick={() => setActiveTab('personnel')} className={`${tabStyle} ${activeTab === 'personnel' ? activeTabStyle : inactiveTabStyle}`}>Personel Ödemeleri</button>
                    <button onClick={() => setActiveTab('defter')} className={`${tabStyle} ${activeTab === 'defter' ? activeTabStyle : inactiveTabStyle}`}>Defter</button>
                    <button onClick={() => setActiveTab('ortak_kasa')} className={`${tabStyle} ${activeTab === 'ortak_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ortak Kasa</button>
                </div>
            </div>

            {activeTab === 'personnel' && (
                <PersonnelPaymentsView 
                    personnelPayments={props.personnelPayments}
                    personnel={props.personnel}
                    customers={props.customers}
                    customerJobs={props.customerJobs}
                    onAddPersonnelPayment={props.onAddPersonnelPayment}
                    onDeletePersonnelPayment={props.onDeletePersonnelPayment}
                />
            )}
            {activeTab === 'defter' && (
                <DefterView 
                    entries={props.defterEntries} 
                    onAdd={props.onAddDefterEntry} 
                    onUpdate={props.onUpdateDefterEntry} 
                    onDelete={props.onDeleteDefterEntry} 
                />
            )}
            {activeTab === 'ortak_kasa' && (
                <OrtakKasaView 
                    expenses={props.sharedExpenses} 
                    onAdd={props.onAddSharedExpense} 
                    onUpdate={props.onUpdateSharedExpense} 
                    onDelete={props.onDeleteSharedExpense}
                />
            )}
        </div>
    );
}

export default KasaView;
// #endregion