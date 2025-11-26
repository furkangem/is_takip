

import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { DefterEntry, DefterNote, NoteCategory } from '../types';
import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon, DocumentCheckIcon, TrendingUpIcon, TrendingDownIcon, ChevronDownIcon, CalendarIcon, DocumentTextIcon, TagIcon, ClockIcon } from './icons/Icons';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'; // Gelen değer boşsa tire döndür
    try {
        // Backend'den gelen tarih string'inin UTC olduğunu varsayıyoruz.
        // JavaScript'in Date nesnesinin bunu doğru yorumlaması için string'in
        // sonunda 'Z' (UTC işareti) olduğundan emin olalım veya ISO formatına yakınlaştıralım.

        let processedDateString = dateString.replace(' ', 'T'); // "YYYY-MM-DD HH:mm:ss" formatını "YYYY-MM-DDTHH:mm:ss" yap

        // Eğer 'Z' yoksa ve saat bilgisi varsa (T içeriyorsa) ve timezone offset (+/-) yoksa 'Z' ekle
        if (!processedDateString.endsWith('Z') && processedDateString.includes('T') && !processedDateString.includes('+') && !processedDateString.includes('-')) {
             // Veritabanından gelen .NET DateTime string'i fazla milisaniye içerebilir, ilk 3 haneyi alalım
             const parts = processedDateString.split('.');
             if (parts.length > 1) {
                 processedDateString = parts[0] + '.' + parts[1].substring(0, 3) + 'Z';
             } else {
                 processedDateString += 'Z'; // Milisaniye yoksa direkt Z ekle
             }
        }
        // Eğer sadece tarih varsa ("YYYY-MM-DD"), bunu UTC gece yarısı olarak yorumlamasını önle, yerel tarih olarak al.
        else if (!processedDateString.includes('T') && !processedDateString.includes(':')) {
             // Saat ekleyerek tarayıcının yerel olarak yorumlamasını sağla (örn: "2023-10-19T00:00:00")
             const dateOnly = new Date(processedDateString + 'T00:00:00');
             if (!isNaN(dateOnly.getTime())) {
                 // Sadece tarihi göster
                 return dateOnly.toLocaleDateString('tr-TR', {
                     day: '2-digit',
                     month: 'long',
                     year: 'numeric'
                 });
             }
        }


        const date = new Date(processedDateString); // Tarihi UTC olarak yorumla

        // Geçersiz tarih kontrolü
        if (isNaN(date.getTime())) {
             console.warn("formatDateTime: Geçersiz tarih formatı algılandı.", dateString, "->", processedDateString);
             return dateString; // Hata durumunda orijinal string'i göster
        }

        // toLocaleString, tarayıcının yerel saat dilimine göre doğru çeviriyi yapacaktır.
        // Örnek: 12:50 UTC -> 15:50 TR Saati
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
            // timeZone: 'Europe/Istanbul' // Genellikle gerekmez, tarayıcı halleder
        });
    } catch (error) {
        console.error("formatDateTime hatası:", error, "Gelen Değer:", dateString);
        return '-'; // Hata durumunda tire döndür
    }
};

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

const NoteEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: Omit<DefterNote, 'id' | 'createdAt' | 'completed'> | DefterNote) => void;
    noteToEdit: DefterNote | null;
}> = ({ isOpen, onClose, onSave, noteToEdit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'todo' as NoteCategory,
        dueDate: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (noteToEdit) {
                setFormData({
                    title: noteToEdit.title,
                    description: noteToEdit.description || '',
                    category: noteToEdit.category,
                    dueDate: noteToEdit.dueDate || '',
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    category: 'todo',
                    dueDate: '',
                });
            }
        }
    }, [isOpen, noteToEdit]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('Lütfen bir başlık girin.');
            return;
        }

        const noteData = {
            ...formData,
            dueDate: formData.dueDate || undefined,
            description: formData.description || undefined,
        };

        if (noteToEdit) {
            onSave({ ...noteToEdit, ...noteData });
        } else {
            onSave(noteData);
        }
        onClose();
    };

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{noteToEdit ? 'Notu Düzenle' : 'Yeni Not Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Başlık</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className={commonInputClass} />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Açıklama (Opsiyonel)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className={commonInputClass} rows={3}></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={commonInputClass}>
                                <option value="todo">Yapılacak</option>
                                <option value="reminder">Hatırlatma</option>
                                <option value="important">Önemli</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Vade Tarihi (Opsiyonel)</label>
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className={commonInputClass} />
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

interface DefterViewProps {
    entries: DefterEntry[];
    notes: DefterNote[];
    onAddEntry: (entry: Omit<DefterEntry, 'id'>) => void;
    onUpdateEntry: (entry: DefterEntry) => void;
    onDeleteEntry: (entryId: string) => void;
    onAddNote: (note: Omit<DefterNote, 'id' | 'createdAt' | 'completed'>) => void;
    onUpdateNote: (note: DefterNote) => void;
    onDeleteNote: (noteId: string) => void;
    isReadOnly?: boolean;
    navigateToId: string | null;
    onNavigationComplete: () => void;
}

const DefterView: React.FC<DefterViewProps> = (props) => {
    const { entries, notes, onAddEntry, onUpdateEntry, onDeleteEntry, onAddNote, onUpdateNote, onDeleteNote, isReadOnly, navigateToId, onNavigationComplete } = props;

    // Güvenlik kontrolü - undefined verileri boş array'e çevir
    const safeEntries = entries || [];
    const safeNotes = notes || [];
    
    // Güvenlik kontrolü - callback fonksiyonları için
    const safeOnAddEntry = onAddEntry || (() => {});
    const safeOnUpdateEntry = onUpdateEntry || (() => {});
    const safeOnDeleteEntry = onDeleteEntry || (() => {});
    const safeOnAddNote = onAddNote || (() => {});
    const safeOnUpdateNote = onUpdateNote || (() => {});
    const safeOnDeleteNote = onDeleteNote || (() => {});
    const safeOnNavigationComplete = onNavigationComplete || (() => {});

    useEffect(() => {
        if (navigateToId) {
            const element = document.getElementById(`defter-item-${navigateToId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-blue-100', 'ring-2', 'ring-blue-500');
                const timer = setTimeout(() => {
                    element.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-500');
                }, 2500);
                safeOnNavigationComplete();
                return () => clearTimeout(timer);
            } else {
                safeOnNavigationComplete();
            }
        }
    }, [navigateToId, onNavigationComplete]);

    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<DefterEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<DefterEntry | null>(null);

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState<DefterNote | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<DefterNote | null>(null);

    const [showPaidIncomes, setShowPaidIncomes] = useState(false);
    const [showPaidExpenses, setShowPaidExpenses] = useState(false);
    const [showCompletedNotes, setShowCompletedNotes] = useState(false);

    const handleSaveEntry = (data: DefterEntry | Omit<DefterEntry, 'id'>) => { 'id' in data ? safeOnUpdateEntry(data) : safeOnAddEntry(data as Omit<DefterEntry, 'id'>) };
    const handleToggleEntryStatus = (entry: DefterEntry) => safeOnUpdateEntry({ ...entry, status: entry.status === 'unpaid' ? 'paid' : 'unpaid', paidDate: entry.status === 'unpaid' ? new Date().toISOString().split('T')[0] : undefined });
    
    const handleSaveNote = (data: Omit<DefterNote, 'id' | 'createdAt' | 'completed'> | DefterNote) => { 'id' in data ? safeOnUpdateNote(data) : safeOnAddNote(data) };
    const handleToggleNoteStatus = (note: DefterNote) => safeOnUpdateNote({ ...note, completed: !note.completed });

    const { incomeEntries, expenseEntries } = useMemo(() => {
        const sortLogic = (a: DefterEntry, b: DefterEntry) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime();
        const incomes = safeEntries.filter(e => e.type === 'income');
        const expenses = safeEntries.filter(e => e.type === 'expense');
        return {
            incomeEntries: { unpaid: incomes.filter(e => e.status === 'unpaid').sort(sortLogic), paid: incomes.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()) },
            expenseEntries: { unpaid: expenses.filter(e => e.status === 'unpaid').sort(sortLogic), paid: expenses.filter(e => e.status === 'paid').sort((a,b) => new Date(b.paidDate || b.date).getTime() - new Date(a.paidDate || a.date).getTime()) },
        };
    }, [safeEntries]);
    
    const { uncompletedNotes, completedNotes } = useMemo(() => {
        const uncompleted = safeNotes.filter(n => !n.completed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const completed = safeNotes.filter(n => n.completed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { uncompletedNotes: uncompleted, completedNotes: completed };
    }, [safeNotes]);
    
    const totalUnpaidIncome = useMemo(() => incomeEntries.unpaid.reduce((sum: number, e: DefterEntry) => sum + e.amount, 0), [incomeEntries.unpaid]);
    const totalUnpaidExpense = useMemo(() => expenseEntries.unpaid.reduce((sum: number, e: DefterEntry) => sum + e.amount, 0), [expenseEntries.unpaid]);

    const EntryListItem: React.FC<{entry: DefterEntry}> = ({entry}) => (
        <li id={`defter-item-${entry.id}`} className="p-3 group transition-all duration-300">
           <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                     <button onClick={() => !isReadOnly && handleToggleEntryStatus(entry)} className="flex-shrink-0" disabled={isReadOnly} title={entry.status === 'paid' ? 'Ödenmedi İşaretle' : 'Ödendi İşaretle'}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${entry.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}>
                            {entry.status === 'paid' && <DocumentCheckIcon className="h-3 w-3 text-white"/>}
                        </div>
                    </button>
                    <div className="min-w-0">
                        <p className={`font-semibold truncate ${entry.status === 'paid' ? 'line-through text-gray-600' : 'text-gray-800'}`}>{entry.description}</p>
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
                    {!isReadOnly && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setEntryToEdit(entry); setIsEntryModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button>
                        <button onClick={() => setEntryToDelete(entry)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                    </div>}
                </div>
           </div>
        </li>
    );
    
    const NoteListItem: React.FC<{note: DefterNote}> = ({note}) => {
        const categoryStyles: Record<NoteCategory, string> = {
            todo: 'bg-blue-100 text-blue-800',
            reminder: 'bg-yellow-100 text-yellow-800',
            important: 'bg-red-100 text-red-800',
        };
        const categoryNames: Record<NoteCategory, string> = { todo: 'Yapılacak', reminder: 'Hatırlatma', important: 'Önemli' };
        const isOverdue = !note.completed && note.dueDate && new Date(note.dueDate) < new Date();
        return (
            <div id={`defter-item-${note.id}`} className={`p-3 group space-y-2 rounded-lg transition-all duration-300 ${note.completed ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input type="checkbox" checked={note.completed} onChange={() => !isReadOnly && handleToggleNoteStatus(note)} disabled={isReadOnly} className="mt-1 form-checkbox h-5 w-5 rounded text-blue-600 disabled:cursor-not-allowed"/>
                        <div className="min-w-0">
                             <p className={`font-semibold ${note.completed ? 'line-through text-gray-600' : 'text-gray-800'}`}>{note.title}</p>
                        </div>
                    </div>
                    {!isReadOnly && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setNoteToEdit(note); setIsNoteModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button>
                        <button onClick={() => setNoteToDelete(note)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                    </div>}
                </div>
                 {note.description && <p className={`pl-8 text-sm ${note.completed ? 'line-through text-gray-600' : 'text-gray-600'}`}>{note.description}</p>}
                <div className="pl-8 flex items-center justify-between text-xs text-gray-500">
                     <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 font-medium rounded-full ${categoryStyles[note.category]}`}>{categoryNames[note.category]}</span>
                         {note.dueDate && <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}><CalendarIcon className="h-3 w-3"/>{formatDate(note.dueDate)}</span>}
                     </div>
                     <span className="flex items-center gap-1 flex-shrink-0" title="Oluşturulma Tarihi">
                        <ClockIcon className="h-3 w-3"/>
                        {formatDateTime(note.createdAt)}
                     </span>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b bg-green-50 rounded-t-lg">
                        <div>
                            <h3 className="text-xl font-semibold text-green-800 flex items-center gap-2"><TrendingUpIcon className="h-6 w-6"/>Alacaklar</h3>
                            <p className="text-sm text-green-700 mt-1">Ödenmemiş Toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidIncome)}</span></p>
                        </div>
                         {!isReadOnly && <button onClick={() => { setEntryToEdit(null); setIsEntryModalOpen(true); }} className="flex-shrink-0 flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow"><PlusIcon className="h-4 w-4 mr-1"/>Kayıt Ekle</button>}
                    </div>
                    <div className="flex-grow"><ul className="divide-y divide-gray-200">{incomeEntries.unpaid.length > 0 ? incomeEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş alacak bulunmuyor.</li>}</ul></div>
                    {incomeEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidIncomes(!showPaidIncomes)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Tahsil Edilenler ({incomeEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidIncomes ? 'rotate-180' : ''}`}/></button>{showPaidIncomes && <ul className="divide-y divide-gray-200 bg-gray-50/50">{incomeEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}
                </div>
                 <div className="bg-white rounded-lg shadow-md flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b bg-red-50 rounded-t-lg">
                        <div>
                            <h3 className="text-xl font-semibold text-red-800 flex items-center gap-2"><TrendingDownIcon className="h-6 w-6"/>Borçlar / Giderler</h3>
                            <p className="text-sm text-red-700 mt-1">Ödenmemiş Toplam: <span className="font-bold text-lg">{formatCurrency(totalUnpaidExpense)}</span></p>
                        </div>
                    </div>
                    <div className="flex-grow"><ul className="divide-y divide-gray-200">{expenseEntries.unpaid.length > 0 ? expenseEntries.unpaid.map(entry => <EntryListItem key={entry.id} entry={entry} />) : <li className="p-6 text-center text-sm text-gray-500">Ödenmemiş borç bulunmuyor.</li>}</ul></div>
                    {expenseEntries.paid.length > 0 && <div className="border-t"><button onClick={() => setShowPaidExpenses(!showPaidExpenses)} className="w-full p-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex justify-center items-center gap-2 rounded-b-lg"><span>Ödenenler ({expenseEntries.paid.length})</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${showPaidExpenses ? 'rotate-180' : ''}`}/></button>{showPaidExpenses && <ul className="divide-y divide-gray-200 bg-gray-50/50">{expenseEntries.paid.map(entry => <EntryListItem key={entry.id} entry={entry} />)}</ul>}</div>}
                </div>
                <div className="bg-gray-50 rounded-lg shadow-md flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b bg-yellow-50 rounded-t-lg">
                        <h3 className="text-xl font-semibold text-yellow-800 flex items-center gap-2"><DocumentTextIcon className="h-6 w-6"/>Not Paneli</h3>
                        {!isReadOnly && <button onClick={() => { setNoteToEdit(null); setIsNoteModalOpen(true); }} className="flex-shrink-0 flex items-center text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded-lg shadow"><PlusIcon className="h-4 w-4 mr-1"/>Yeni Not</button>}
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                         {uncompletedNotes.length === 0 && completedNotes.length === 0 && <div className="flex items-center justify-center h-full text-center text-gray-500 text-sm">Hiç not eklenmemiş.</div>}
                         {uncompletedNotes.length > 0 && <div className="space-y-2">{uncompletedNotes.map(note => <NoteListItem key={note.id} note={note} />)}</div>}
                         {completedNotes.length > 0 && (
                            <div className="border-t mt-4 pt-2">
                                <button
                                    onClick={() => setShowCompletedNotes(!showCompletedNotes)}
                                    className="w-full flex justify-between items-center p-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    <span>Tamamlanan Notlar ({completedNotes.length})</span>
                                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${showCompletedNotes ? 'rotate-180' : ''}`} />
                                </button>
                                {showCompletedNotes && (
                                    <div className="mt-2 space-y-2">
                                        {completedNotes.map(note => <NoteListItem key={note.id} note={note} />)}
                                    </div>
                                )}
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                {isEntryModalOpen && <DefterEntryEditorModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} onSave={handleSaveEntry} entryToEdit={entryToEdit} />}
                {entryToDelete && <ConfirmationModal isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={() => { if(entryToDelete) safeOnDeleteEntry(entryToDelete.id); setEntryToDelete(null); }} title="Kaydı Sil" message={`'${entryToDelete?.description}' kaydını silmek istediğinizden emin misiniz?`}/>}
                {isNoteModalOpen && <NoteEditorModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} onSave={handleSaveNote} noteToEdit={noteToEdit} />}
                {noteToDelete && <ConfirmationModal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} onConfirm={() => { if(noteToDelete) safeOnDeleteNote(noteToDelete.id); setNoteToDelete(null); }} title="Notu Sil" message={`'${noteToDelete?.title}' başlıklı notu silmek istediğinizden emin misiniz?`}/>}
            </Suspense>
        </>
    );
}

export default DefterView;