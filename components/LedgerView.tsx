
import React, { useState, useMemo, useEffect } from 'react';
import { DefterEntry, SharedExpense, Payer, PaymentMethod, DefterNote } from '../types';
// FIX: Add missing DocumentTextIcon to resolve import error.
import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon, BanknotesIcon, DocumentCheckIcon, TrendingUpIcon, TrendingDownIcon, ChevronDownIcon, CashIcon, CreditCardIcon, ArrowsRightLeftIcon, CalendarIcon, DocumentTextIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';
import StatCard from './ui/StatCard';

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

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

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

// #region DefterView Component
interface DefterViewProps {
    entries: DefterEntry[];
    notes: DefterNote[];
    filters: { startDate: string; endDate: string; type: 'all' | 'income' | 'expense' };
    onFilterChange: (filters: DefterViewProps['filters']) => void;
    onAdd: (entry: Omit<DefterEntry, 'id'>) => void;
    onUpdate: (entry: DefterEntry) => void;
    onDelete: (entryId: string) => void;
    onAddNote: (content: string) => void;
    onUpdateNote: (note: DefterNote) => void;
    onDeleteNote: (noteId: string) => void;
}

const DefterView: React.FC<DefterViewProps> = (props) => {
    const { entries, notes, filters, onFilterChange, onAdd, onUpdate, onDelete, onAddNote, onUpdateNote, onDeleteNote } = props;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<DefterEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<DefterEntry | null>(null);
    const [showPaidIncomes, setShowPaidIncomes] = useState(false);
    const [showPaidExpenses, setShowPaidExpenses] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);
    const [newNoteContent, setNewNoteContent] = useState('');

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);
    
    const handleLocalFilterChange = (key: keyof typeof filters, value: string) => setLocalFilters(prev => ({ ...prev, [key]: value }));
    const clearFilters = () => {
        const clearedFilters = { startDate: '', endDate: '', type: 'all' as const };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const handleSaveEntry = (data: DefterEntry | Omit<DefterEntry, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data as Omit<DefterEntry, 'id'>) };
    const handleToggleStatus = (entry: DefterEntry) => onUpdate({ ...entry, status: entry.status === 'unpaid' ? 'paid' : 'unpaid', paidDate: entry.status === 'unpaid' ? new Date().toISOString().split('T')[0] : undefined });
    
    const { incomeEntries, expenseEntries } = useMemo(() => {
        const sortLogic = (a: DefterEntry, b: DefterEntry) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime();
        const incomes = entries.filter(e => e.type === 'income');
        const expenses = entries.filter(e => e.type === 'expense');
        return {
            incomeEntries: { unpaid: incomes.filter(e => e.status === 'unpaid').sort(sortLogic), paid: incomes.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()) },
            expenseEntries: { unpaid: expenses.filter(e => e.status === 'unpaid').sort(sortLogic), paid: expenses.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()) },
        };
    }, [entries]);
    
    const { uncompletedNotes, completedNotes } = useMemo(() => {
        const uncompleted = notes.filter(n => !n.completed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const completed = notes.filter(n => n.completed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { uncompletedNotes: uncompleted, completedNotes: completed };
    }, [notes]);
    
    const totalUnpaidIncome = useMemo(() => incomeEntries.unpaid.reduce((sum, e) => sum + e.amount, 0), [incomeEntries.unpaid]);
    const totalUnpaidExpense = useMemo(() => expenseEntries.unpaid.reduce((sum, e) => sum + e.amount, 0), [expenseEntries.unpaid]);

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoteContent.trim()) {
            onAddNote(newNoteContent.trim());
            setNewNoteContent('');
        }
    };
    
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
                             <span className="flex items-center gap-1" title="İşlem Tarihi"><CalendarIcon className="h-3 w-3"/> {formatDate(entry.date)}</span>
                             {entry.dueDate && (<span className="flex items-center gap-1" title="Vade Tarihi"><CalendarIcon className="h-3 w-3 text-orange-500"/> Vade: {formatDate(entry.dueDate)}</span>)}
                             {entry.paidDate && (<span className="flex items-center gap-1" title="Ödenme Tarihi"><DocumentCheckIcon className="h-3 w-3 text-green-500"/> Ödendi: {formatDate(entry.paidDate)}</span>)}
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

    const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700">Defter</h2>
                <button onClick={() => { setEntryToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow"><PlusIcon className="h-5 w-5 mr-2"/>Yeni Kayıt</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label><input type="date" value={localFilters.startDate} onChange={e => handleLocalFilterChange('startDate', e.target.value)} className={commonInputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label><input type="date" value={localFilters.endDate} onChange={e => handleLocalFilterChange('endDate', e.target.value)} className={commonInputClass} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi</label><select value={localFilters.type} onChange={e => handleLocalFilterChange('type', e.target.value)} className={commonInputClass}><option value="all">Tümü</option><option value="income">Alacak / Gelir</option><option value="expense">Borç / Gider</option></select></div>
                    <div className="flex gap-2"><button onClick={() => onFilterChange(localFilters)} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Filtrele</button><button onClick={clearFilters} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Temizle</button></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md flex flex-col"><div className="p-4 border-b bg-green-50 rounded-t-lg"><h3 className="text-xl font-semibold text-green-800 flex items-center gap-2"><TrendingUpIcon className="h-6 w-6"/>Alacaklar</h3><p className="text-sm text-green-700 mt-1">Tahsil edilecek toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidIncome)}</span></p></div><div className="flex-grow"><ul className="divide-y divide-gray-200">{incomeEntries.unpaid.length > 0 ? incomeEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş alacak bulunmuyor.</li>}</ul></div>{incomeEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidIncomes(!showPaidIncomes)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Tahsil Edilenler ({incomeEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidIncomes ? 'rotate-180' : ''}`}/></button>{showPaidIncomes && <ul className="divide-y divide-gray-200 bg-gray-50/50">{incomeEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}</div>
                <div className="bg-white rounded-lg shadow-md flex flex-col"><div className="p-4 border-b bg-red-50 rounded-t-lg"><h3 className="text-xl font-semibold text-red-800 flex items-center gap-2"><TrendingDownIcon className="h-6 w-6"/>Borçlar / Giderler</h3><p className="text-sm text-red-700 mt-1">Ödenecek toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidExpense)}</span></p></div><div className="flex-grow"><ul className="divide-y divide-gray-200">{expenseEntries.unpaid.length > 0 ? expenseEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş borç bulunmuyor.</li>}</ul></div>{expenseEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidExpenses(!showPaidExpenses)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Ödenenler ({expenseEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidExpenses ? 'rotate-180' : ''}`}/></button>{showPaidExpenses && <ul className="divide-y divide-gray-200 bg-gray-50/50">{expenseEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}</div>
                <div className="bg-white rounded-lg shadow-md flex flex-col"><div className="p-4 border-b bg-yellow-50 rounded-t-lg"><h3 className="text-xl font-semibold text-yellow-800 flex items-center gap-2"><DocumentTextIcon className="h-6 w-6"/>Not Paneli</h3></div><div className="flex-grow flex flex-col"><div className="flex-1 overflow-y-auto p-2 space-y-2">{uncompletedNotes.map(note => (<div key={note.id} className="p-2 group flex items-start gap-2"><button onClick={() => onUpdateNote({...note, completed: true})} className="mt-1 shrink-0 w-4 h-4 rounded-full border-2 border-gray-300 hover:border-blue-500 focus:outline-none"></button><div className="flex-1"><p className="text-sm text-gray-700">{note.content}</p></div><button onClick={() => onDeleteNote(note.id)} className="shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><TrashIcon className="h-4 w-4"/></button></div>))}{completedNotes.map(note => (<div key={note.id} className="p-2 group flex items-start gap-2"><button onClick={() => onUpdateNote({...note, completed: false})} className="mt-1 shrink-0 w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center"><DocumentCheckIcon className="h-2.5 w-2.5 text-white"/></button><div className="flex-1"><p className="text-sm text-gray-500 line-through">{note.content}</p></div><button onClick={() => onDeleteNote(note.id)} className="shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><TrashIcon className="h-4 w-4"/></button></div>))}</div><div className="p-2 border-t mt-auto"><form onSubmit={handleAddNote} className="flex gap-2"><input type="text" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Yeni not ekle..." className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500"/><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Ekle</button></form></div></div></div>
            </div>

            <DefterEntryEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEntry} entryToEdit={entryToEdit} />
            <ConfirmationModal isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={() => { if(entryToDelete) onDelete(entryToDelete.id); setEntryToDelete(null); }} title="Kaydı Sil" message={`'${entryToDelete?.description}' kaydını silmek istediğinizden emin misiniz?`}/>
        </>
    );
}
// #endregion

// #region OrtakKasaView Component
interface OrtakKasaViewProps {
    expenses: SharedExpense[];
    filters: { startDate: string; endDate: string; payer: 'all' | Payer; status: 'all' | 'paid' | 'unpaid'; paymentMethod: 'all' | PaymentMethod };
    onFilterChange: (filters: OrtakKasaViewProps['filters']) => void;
    onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
    onUpdate: (expense: SharedExpense) => void;
    onDelete: (expenseId: string) => void;
}

const OrtakKasaView: React.FC<OrtakKasaViewProps> = ({ expenses, filters, onFilterChange, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SharedExpense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<SharedExpense | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);
    
    const handleLocalFilterChange = (key: keyof typeof filters, value: string) => {
        setLocalFilters(prev => ({...prev, [key]: value as any}));
    };
    
    const clearFilters = () => {
        const clearedFilters = { startDate: '', endDate: '', payer: 'all' as const, status: 'all' as const, paymentMethod: 'all' as const };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const handleSaveExpense = (data: SharedExpense | Omit<SharedExpense, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data) };
    const handleToggleStatus = (expense: SharedExpense) => onUpdate({ ...expense, status: expense.status === 'unpaid' ? 'paid' : 'unpaid' });
    
    const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

    return (
        <>
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-700">Ortak Kasa</h2></div>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Bireysel Harcamalar</h3>
                        <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><PlusIcon className="h-4 w-4 mr-1"/>Gider Ekle</button>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                            <input type="date" value={localFilters.startDate} onChange={e => handleLocalFilterChange('startDate', e.target.value)} className={commonInputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input type="date" value={localFilters.endDate} onChange={e => handleLocalFilterChange('endDate', e.target.value)} className={commonInputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeyen</label>
                            <select value={localFilters.payer} onChange={e => handleLocalFilterChange('payer', e.target.value)} className={commonInputClass}>
                                <option value="all">Tümü</option><option>Kasa</option><option>Ömer</option><option>Barış</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                            <select value={localFilters.status} onChange={e => handleLocalFilterChange('status', e.target.value)} className={commonInputClass}>
                                <option value="all">Tümü</option><option value="paid">Ödendi</option><option value="unpaid">Ödenmedi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                            <select value={localFilters.paymentMethod} onChange={e => handleLocalFilterChange('paymentMethod', e.target.value)} className={commonInputClass}>
                                <option value="all">Tümü</option>
                                <option value="cash">Nakit</option>
                                <option value="card">Kart</option>
                                <option value="transfer">Havale</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onFilterChange(localFilters)} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Filtrele</button>
                            <button onClick={clearFilters} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Temizle</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[600px]"><thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr><th className="p-3">Durum</th><th className="p-3">Açıklama</th><th className="p-3">Tutar</th><th className="p-3 hidden md:table-cell">Ödeyen</th><th className="p-3 hidden md:table-cell">Yöntem</th><th className="p-3 hidden sm:table-cell">Tarih</th><th className="p-3"></th></tr></thead>
                <tbody className="divide-y divide-gray-200">{expenses.length > 0 ? expenses.map(exp => { const PaymentIcon = paymentMethodIcons[exp.paymentMethod]; return (
                    <tr key={exp.id} className="group hover:bg-gray-50"><td className="p-3"><button onClick={() => handleToggleStatus(exp)} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${exp.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{exp.status === 'paid' ? 'Ödendi' : 'Ödenmedi'}</button></td>
                    <td className="p-3 font-medium text-gray-800">{exp.description}</td><td className="p-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                    <td className="p-3 hidden md:table-cell text-gray-600">{exp.payer}</td>
                    <td className="p-3 hidden md:table-cell"><span className="flex items-center gap-1.5 text-gray-600"><PaymentIcon className="h-4 w-4"/> {paymentMethodNames[exp.paymentMethod]}</span></td>
                    <td className="p-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{formatDateTime(exp.date)}</td>
                    <td className="p-3 text-right"><div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => {setExpenseToEdit(exp); setIsModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button><button onClick={() => setExpenseToDelete(exp)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button></div></td></tr>
                );}) : <tr><td colSpan={7} className="p-6 text-center text-gray-500">Filtrelere uygun kayıt bulunamadı.</td></tr>}</tbody></table></div>
            </div>
            <SharedExpenseEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} expenseToEdit={expenseToEdit} />
            <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if(expenseToDelete) onDelete(expenseToDelete.id); setExpenseToDelete(null); }} title="Gideri Sil" message={`'${expenseToDelete?.description}' giderini silmek istediğinizden emin misiniz?`}/>
        </>
    );
}
// #endregion

// #region Main KasaView (Router)
interface KasaViewProps {
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  defterNotes: DefterNote[];
  onAddDefterEntry: (entry: Omit<DefterEntry, 'id'>) => void;
  onUpdateDefterEntry: (entry: DefterEntry) => void;
  onDeleteDefterEntry: (entryId: string) => void;
  onAddDefterNote: (content: string) => void;
  onUpdateDefterNote: (note: DefterNote) => void;
  onDeleteDefterNote: (noteId: string) => void;
  onAddSharedExpense: (expense: Omit<SharedExpense, 'id'>) => void;
  onUpdateSharedExpense: (expense: SharedExpense) => void;
  onDeleteSharedExpense: (expenseId: string) => void;
}

const KasaView: React.FC<KasaViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'defter' | 'ortak_kasa'>('defter');
    
    const [defterFilters, setDefterFilters] = useState({
        startDate: '',
        endDate: '',
        type: 'all' as 'all' | 'income' | 'expense'
    });

    const [sharedFilters, setSharedFilters] = useState({
        startDate: '',
        endDate: '',
        payer: 'all' as 'all' | Payer,
        status: 'all' as 'all' | 'paid' | 'unpaid',
        paymentMethod: 'all' as 'all' | PaymentMethod
    });

    const filteredDefterEntries = useMemo(() => {
        return props.defterEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const startDate = defterFilters.startDate ? new Date(defterFilters.startDate) : null;
            const endDate = defterFilters.endDate ? new Date(defterFilters.endDate) : null;

            if (startDate) {
                startDate.setHours(0,0,0,0);
                if (entryDate < startDate) return false;
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (entryDate > endDate) return false;
            }
            if (defterFilters.type !== 'all' && entry.type !== defterFilters.type) return false;
            
            return true;
        });
    }, [props.defterEntries, defterFilters]);

    const filteredSharedExpenses = useMemo(() => {
        return props.sharedExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const startDate = sharedFilters.startDate ? new Date(sharedFilters.startDate) : null;
            const endDate = sharedFilters.endDate ? new Date(sharedFilters.endDate) : null;
            
            if (startDate) {
                startDate.setHours(0,0,0,0);
                if (expenseDate < startDate) return false;
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (expenseDate > endDate) return false;
            }
            if (sharedFilters.payer !== 'all' && expense.payer !== sharedFilters.payer) return false;
            if (sharedFilters.status !== 'all' && expense.status !== sharedFilters.status) return false;
            if (sharedFilters.paymentMethod !== 'all' && expense.paymentMethod !== sharedFilters.paymentMethod) return false;
            
            return true;
        });
    }, [props.sharedExpenses, sharedFilters]);

    const tabStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
    const activeTabStyle = "bg-blue-600 text-white";
    const inactiveTabStyle = "text-gray-600 hover:bg-blue-100 hover:text-blue-700";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-700">Kasa Yönetimi</h2>
                <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
                    <button onClick={() => setActiveTab('defter')} className={`${tabStyle} ${activeTab === 'defter' ? activeTabStyle : inactiveTabStyle}`}>Defter</button>
                    <button onClick={() => setActiveTab('ortak_kasa')} className={`${tabStyle} ${activeTab === 'ortak_kasa' ? activeTabStyle : inactiveTabStyle}`}>Ortak Kasa</button>
                </div>
            </div>

            {activeTab === 'defter' && (
                <DefterView 
                    entries={filteredDefterEntries}
                    notes={props.defterNotes}
                    filters={defterFilters}
                    onFilterChange={setDefterFilters}
                    onAdd={props.onAddDefterEntry} 
                    onUpdate={props.onUpdateDefterEntry} 
                    onDelete={props.onDeleteDefterEntry}
                    onAddNote={props.onAddDefterNote}
                    onUpdateNote={props.onUpdateDefterNote}
                    onDeleteNote={props.onDeleteDefterNote}
                />
            )}
            {activeTab === 'ortak_kasa' && (
                <OrtakKasaView 
                    expenses={filteredSharedExpenses} 
                    filters={sharedFilters}
                    onFilterChange={setSharedFilters}
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