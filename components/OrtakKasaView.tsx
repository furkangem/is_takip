    import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
    import { Payer, PaymentMethod, SharedExpense } from '../types'; // Payer tipinin 'Omer' | 'Baris' | 'Kasa' olduğundan emin olun
    import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon, BanknotesIcon, CashIcon, CreditCardIcon, ArrowsRightLeftIcon, ArrowUturnLeftIcon, ChevronDownIcon } from './icons/Icons';
    import StatCard from './ui/StatCard';

    const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
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
    const paymentMethodIcons: Record<PaymentMethod, React.ElementType> = { cash: CashIcon, card: CreditCardIcon, transfer: ArrowsRightLeftIcon };
    const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

    const formatLocalDateTime = (date: Date) => {
        const pad = (num: number) => String(num).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
            payer: 'Kasa' as Payer, // Default Kasa
            status: 'paid' as 'paid' | 'unpaid',
            date: '', // Tarih alanı eklendi
        });
        const [dateTouched, setDateTouched] = useState(false);

        React.useEffect(() => {
            if (isOpen) {
                setDateTouched(false);
                if (expenseToEdit) {
                    // Düzenleme modunda: Mevcut tarihi date input formatına çevir (YYYY-MM-DD)
                    const expenseDate = expenseToEdit.date ? new Date(expenseToEdit.date) : new Date();
                    const dateString = expenseDate.toISOString().split('T')[0];
                    setFormData({
                        description: expenseToEdit.description,
                        amount: String(expenseToEdit.amount),
                        paymentMethod: expenseToEdit.paymentMethod,
                        payer: expenseToEdit.payer, // State'e ASCII değer atanacak (Omer, Baris, Kasa)
                        status: expenseToEdit.status,
                        date: dateString,
                    });
                } else {
                    // Yeni ekleme modunda: Bugünün tarihini varsayılan olarak ayarla
                    const today = new Date().toISOString().split('T')[0];
                    setFormData({
                        description: '',
                        amount: '',
                        paymentMethod: 'cash',
                        payer: 'Kasa',
                        status: 'paid',
                        date: today,
                    });
                }
            }
        }, [isOpen, expenseToEdit]);

        if (!isOpen) return null;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            if (name === 'date') {
                setDateTouched(true);
            }
            setFormData(prev => ({ ...prev, [name]: value as any }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const numericAmount = parseFloat(formData.amount);
            if (!formData.description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
                alert('Lütfen açıklama ve geçerli bir tutar girin.');
                return;
            }

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let selectedDateIso: string;

            if (expenseToEdit && !dateTouched) {
                // Düzenlemede tarih alanına dokunulmadıysa mevcut tarihi koru
                selectedDateIso = expenseToEdit.date;
            } else if (!expenseToEdit && !dateTouched) {
                // Yeni eklemede tarih seçilmezse (alan varsayılan bırakılırsa) güncel tarih+saat kullan
                selectedDateIso = formatLocalDateTime(now);
            } else if (!formData.date) {
                selectedDateIso = formatLocalDateTime(now);
            } else {
                const selectedDateOnly = new Date(`${formData.date}T00:00:00`);
                const isSameDay =
                    selectedDateOnly.getFullYear() === startOfToday.getFullYear() &&
                    selectedDateOnly.getMonth() === startOfToday.getMonth() &&
                    selectedDateOnly.getDate() === startOfToday.getDate();

                if (isSameDay) {
                    selectedDateIso = formatLocalDateTime(now);
                } else {
                    const selectedAtSevenPM = new Date(`${formData.date}T19:00:00`);
                    selectedDateIso = formatLocalDateTime(selectedAtSevenPM);
                }
            }

            // formData'dan date alanını çıkar ve expenseData'ya ayrı ekle
            const { date: _, ...formDataWithoutDate } = formData;
            const expenseData = {
                ...formDataWithoutDate,
                amount: numericAmount,
                date: selectedDateIso,
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
                                {/* === GÜNCELLEME BURADA === */}
                                <select name="payer" value={formData.payer} onChange={handleChange} className={commonInputClass}>
                                    <option value="Kasa">Kasa</option>
                                    <option value="Omer">Ömer</option>
                                    <option value="Baris">Barış</option>
                                </select>
                                {/* ========================== */}
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
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tarih</label>
                            <input 
                                type="date" 
                                name="date" 
                                value={formData.date} 
                                onChange={handleChange} 
                                required 
                                className={commonInputClass} 
                            />
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

    interface OrtakKasaViewProps {
        expenses: SharedExpense[];
        onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
        onUpdate: (expense: SharedExpense) => void;
        onDelete: (expenseId: string) => void; // soft delete
        onRestore: (expenseId: string) => void;
        onPermanentlyDelete: (expenseId: string) => void;
        isReadOnly?: boolean;
        navigateToId: string | null;
        onNavigationComplete: () => void;
    }

    const OrtakKasaView: React.FC<OrtakKasaViewProps> = ({ expenses, onAdd, onUpdate, onDelete, onRestore, onPermanentlyDelete, isReadOnly, navigateToId, onNavigationComplete }) => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [expenseToEdit, setExpenseToEdit] = useState<SharedExpense | null>(null);
        const [expenseToDelete, setExpenseToDelete] = useState<SharedExpense | null>(null);
        const [expenseToPermanentlyDelete, setExpenseToPermanentlyDelete] = useState<SharedExpense | null>(null);
        const [showDeleted, setShowDeleted] = useState(false);

        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
        const [selectedPayer, setSelectedPayer] = useState<string>('all'); // State ASCII değer tutacak

        useEffect(() => {
            if (!startDate || !endDate) {
                const defaultStart = new Date('2023-01-01');
                const today = new Date();
                setStartDate(defaultStart.toISOString().split('T')[0]);
                // Bugünün tarihini de dahil etmek için endDate'i bugün olarak ayarla
                setEndDate(today.toISOString().split('T')[0]);
            }
        }, []);
        
        // Expenses değiştiğinde, bugünün tarihinde veri varsa endDate'i bugüne çek
        useEffect(() => {
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endDateObj = endDate ? new Date(endDate) : null;

            const hasTodayData = expenses.some(exp => {
                if (!exp.date) return false;
                const expDate = new Date(exp.date);
                const expDateOnly = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
                return expDateOnly.getTime() === todayOnly.getTime();
            });

            if (hasTodayData && (!endDateObj || endDateObj.getTime() !== todayOnly.getTime())) {
                setEndDate(todayString);
            }
        }, [expenses, endDate]);

        useEffect(() => {
            if (navigateToId) {
                const element = document.getElementById(`shared-expense-${navigateToId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('bg-blue-100', 'ring-2', 'ring-blue-500');
                    const timer = setTimeout(() => {
                        element.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-500');
                    }, 2500);
                    onNavigationComplete();
                    return () => clearTimeout(timer);
                } else {
                    onNavigationComplete();
                }
            }
        }, [navigateToId, onNavigationComplete]);

        const handleSaveExpense = (data: SharedExpense | Omit<SharedExpense, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data) };
        const handleToggleStatus = (expense: SharedExpense) => onUpdate({ ...expense, status: expense.status === 'unpaid' ? 'paid' : 'unpaid' });

        // Kullanıcıya gösterilecek Payer isimleri için mapping
        const payerDisplayNames: Record<Payer, string> = {
            Omer: 'Ömer',
            Baris: 'Barış',
            Kasa: 'Kasa'
        };

        const { activeExpenses, deletedExpenses, omerPaid, barisPaid, kasaBalance } = useMemo(() => {
            let filteredExpenses = expenses;

            if (startDate && endDate) {
                // Tarih karşılaştırması için sadece tarih kısmını kullan (saat bilgisini göz ardı et)
                const start = new Date(startDate + 'T00:00:00');
                const end = new Date(endDate + 'T23:59:59');
                filteredExpenses = expenses.filter(exp => {
                    if (!exp.date) return false;
                    const expDate = new Date(exp.date);
                    // Tarih karşılaştırması için sadece tarih kısmını kullan
                    const expDateOnly = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
                    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                    return expDateOnly >= startDateOnly && expDateOnly <= endDateOnly;
                });
            }

            if (selectedPaymentMethod !== 'all') {
                filteredExpenses = filteredExpenses.filter(exp => exp.paymentMethod === selectedPaymentMethod);
            }

            // Filtreleme yaparken ASCII değeri kullan
            if (selectedPayer !== 'all') {
                filteredExpenses = filteredExpenses.filter(exp => exp.payer === selectedPayer);
            }

            const active = filteredExpenses.filter(e => !e.deletedAt);
            const deleted = filteredExpenses.filter(e => e.deletedAt);

            let omer = 0;
            let baris = 0;
            let kasa = 0;
            active.forEach(exp => {
                if (exp.status === 'paid') {
                    // Hesaplamada ASCII değeri kullan
                    if (exp.payer === 'Omer') omer += exp.amount;
                    else if (exp.payer === 'Baris') baris += exp.amount;
                    else if (exp.payer === 'Kasa') kasa += exp.amount;
                }
            });

            return {
                activeExpenses: active.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                deletedExpenses: deleted.sort((a,b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()),
                omerPaid: omer,
                barisPaid: baris,
                kasaBalance: kasa
            }
        }, [expenses, startDate, endDate, selectedPaymentMethod, selectedPayer]);

        return (
            <div className="space-y-6">
                {/* Filtreler */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        {/* Tarih ve Ödeme Yöntemi Filtreleri (Değişiklik Yok) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                            <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="all">Tüm Yöntemler</option>
                                <option value="cash">Nakit</option>
                                <option value="card">Kart</option>
                                <option value="transfer">Havale</option>
                            </select>
                        </div>
                        {/* === ÖDEYEN FİLTRESİ GÜNCELLEMESİ === */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeyen</label>
                            <select
                                value={selectedPayer} // State hala ASCII değer tutuyor ('Omer', 'Baris', 'Kasa')
                                onChange={(e) => setSelectedPayer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tüm Ödeyenler</option>
                                <option value="Omer">Ömer</option>
                                <option value="Baris">Barış</option>
                                <option value="Kasa">Kasa</option>
                            </select>
                        </div>
                        {/* ================================== */}
                        <div>
                            <button onClick={() => { /* Sıfırlama */ }} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"> Filtreleri Sıfırla </button>
                        </div>
                    </div>
                </div>

                {/* Stat Cards (Değişiklik Yok) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Ömer'den Ödenen" value={formatCurrency(omerPaid)} icon={BanknotesIcon} color="blue" />
                    <StatCard title="Barış'tan Ödenen" value={formatCurrency(barisPaid)} icon={BanknotesIcon} color="blue" />
                    <StatCard title="Kasadan Ödenen" value={formatCurrency(kasaBalance)} icon={CashIcon} color="blue" />
                </div>

                {/* Harcama Listesi */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Bireysel Harcamalar</h3>
                        {!isReadOnly && <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow"><PlusIcon className="h-4 w-4 mr-1"/>Gider Ekle</button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-3">Durum</th>
                                    <th className="p-3">Açıklama</th>
                                    <th className="p-3">Tutar</th>
                                    <th className="p-3 hidden md:table-cell">Ödeyen</th>
                                    <th className="p-3 hidden md:table-cell">Yöntem</th>
                                    <th className="p-3 hidden sm:table-cell">Tarih</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {activeExpenses.length > 0 ? activeExpenses.map(exp => {
                                    const PaymentIcon = paymentMethodIcons[exp.paymentMethod] || CashIcon;
                                    return (
                                        <tr key={exp.id} id={`shared-expense-${exp.id}`} className="group hover:bg-gray-50 transition-all duration-300">
                                            <td className="p-3"><button onClick={() => !isReadOnly && handleToggleStatus(exp)} disabled={isReadOnly} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${exp.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}>{exp.status === 'paid' ? 'Ödendi' : 'Ödenmedi'}</button></td>
                                            <td className="p-3 font-medium text-gray-800">{exp.description}</td>
                                            <td className="p-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                                            {/* === GÖSTERİM GÜNCELLEMESİ === */}
                                            <td className="p-3 hidden md:table-cell text-gray-600">{payerDisplayNames[exp.payer] || exp.payer}</td>
                                            {/* ========================== */}
                                            <td className="p-3 hidden md:table-cell"><span className="flex items-center gap-1.5 text-gray-600"><PaymentIcon className="h-4 w-4"/> {paymentMethodNames[exp.paymentMethod] || 'Nakit'}</span></td>
                                            <td className="p-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{formatDateTime(exp.date)}</td>
                                            <td className="p-3 text-right">
                                                {!isReadOnly && <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {setExpenseToEdit(exp); setIsModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600" title="Düzenle"><PencilIcon className="h-4 w-4"/></button>
                                                    <button onClick={() => setExpenseToDelete(exp)} className="p-1 text-gray-400 hover:text-red-600" title="Arşivle"><TrashIcon className="h-4 w-4"/></button>
                                                </div>}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr> <td colSpan={7} className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td> </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Silinmiş Harcamalar Bölümü (Değişiklik Yok, payer gösterimi güncellendi) */}
                {deletedExpenses.length > 0 && (
                    <div className="bg-gray-100 rounded-lg">
                        <button onClick={() => setShowDeleted(!showDeleted)} className="w-full p-3 text-left font-semibold text-gray-700 flex justify-between items-center hover:bg-gray-200 rounded-t-lg">
                            <span>Silinmiş Harcamalar ({deletedExpenses.length})</span>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${showDeleted ? 'rotate-180' : ''}`} />
                        </button>
                        {showDeleted && (
                            <div className="p-4">
                                <div className="space-y-3">
                                    {deletedExpenses.map(exp => {
                                        const PaymentIcon = paymentMethodIcons[exp.paymentMethod] || CashIcon;
                                        return (
                                            <div key={exp.id} className="bg-white rounded-lg border border-gray-200 p-4 group hover:shadow-sm transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        {/* Ana Bilgiler */}
                                                        <div className="mb-3">
                                                            <h4 className="font-semibold text-gray-800 text-sm mb-1">{exp.description}</h4>
                                                            <div className="text-lg font-bold text-red-600">{formatCurrency(exp.amount)}</div>
                                                        </div>
                                                        
                                                        {/* Detay Bilgiler */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Ödeyen:</span>
                                                                <span>{payerDisplayNames[exp.payer] || exp.payer}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <PaymentIcon className="h-3 w-3"/>
                                                                <span>{paymentMethodNames[exp.paymentMethod] || 'Nakit'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Durum:</span>
                                                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${exp.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    {exp.status === 'paid' ? 'Ödendi' : 'Ödenmedi'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Tarih:</span>
                                                                <span>{formatDateTime(exp.date)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Silinme Tarihi */}
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            <span className="font-medium">Silinme Tarihi:</span> {formatDateTime(exp.deletedAt)}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Butonlar */}
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <button 
                                                            onClick={() => onRestore(exp.id)} 
                                                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                                                            title="Geri Yükle"
                                                        >
                                                            <ArrowUturnLeftIcon className="h-3 w-3"/>
                                                            Geri Yükle
                                                        </button>
                                                        <button 
                                                            onClick={() => setExpenseToPermanentlyDelete(exp)} 
                                                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                                                            title="Kalıcı Olarak Sil"
                                                        >
                                                            <TrashIcon className="h-3 w-3"/>
                                                            Kalıcı Sil
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Modallar (Değişiklik Yok) */}
                <Suspense fallback={null}>
                    {isModalOpen && <SharedExpenseEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} expenseToEdit={expenseToEdit} />}
                    {expenseToDelete && <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if(expenseToDelete) onDelete(expenseToDelete.id); setExpenseToDelete(null); }} title="Harcamayı Arşivle" message={`'${expenseToDelete?.description}' harcamasını arşive taşımak istediğinizden emin misiniz? Bu harcama daha sonra geri yüklenebilir.`}/>}
                    {expenseToPermanentlyDelete && ( <ConfirmationModal isOpen={!!expenseToPermanentlyDelete} onClose={() => setExpenseToPermanentlyDelete(null)} onConfirm={() => { if(expenseToPermanentlyDelete) onPermanentlyDelete(expenseToPermanentlyDelete.id); setExpenseToPermanentlyDelete(null); }} title="Harcamayı Kalıcı Olarak Sil" message={`'${expenseToPermanentlyDelete?.description}' harcamasını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}/> )}
                </Suspense>
            </div>
        );
    }

    export default OrtakKasaView;