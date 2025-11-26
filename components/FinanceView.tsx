

import React, { useState, useMemo, useEffect } from 'react';
// FIX: Import Payer and PaymentMethod types.
import { Income, Expense, User, Personnel, PersonnelPayment, Role, Payer, PaymentMethod } from '../types';
import { PlusIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, XMarkIcon, TrashIcon, CurrencyDollarIcon, MagnifyingGlassIcon, BanknotesIcon, UserGroupIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';

interface FinanceViewProps {
    personnel: Personnel[];
    incomes: Income[];
    expenses: Expense[];
    onAddIncome: (income: Omit<Income, 'id'>) => void;
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onDeleteIncome: (incomeId: string) => void;
    onDeleteExpense: (expenseId: string) => void;
    selectedMonth: Date;
    onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
}

type TransactionType = 'income' | 'expense' | 'personnelPayment';

const AddTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddIncome: (income: Omit<Income, 'id'>) => void;
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
    personnel: Personnel[];
}> = ({ isOpen, onClose, onAddIncome, onAddExpense, onAddPersonnelPayment, personnel }) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payeeId, setPayeeId] = useState('');
    // FIX: Add state for payer and paymentMethod.
    const [payer, setPayer] = useState<Payer>('Kasa');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

    const allPersonnel = useMemo(() => personnel, [personnel]);
    
    useEffect(() => {
        if(isOpen) {
            setType('expense');
            setDescription('');
            setAmount('');
            setPayeeId('');
            // FIX: Reset payer and paymentMethod on close.
            setPayer('Kasa');
            setPaymentMethod('cash');
        }
    }, [isOpen])

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen geçerli ve pozitif bir tutar girin.');
            return;
        }

        const date = new Date().toISOString();

        switch (type) {
            case 'income':
                if (!description.trim()) { alert('Lütfen bir açıklama girin.'); return; }
                onAddIncome({ description, amount: numericAmount, date });
                break;
            case 'expense':
                if (!description.trim()) { alert('Lütfen bir açıklama girin.'); return; }
                onAddExpense({ description, amount: numericAmount, date });
                break;
            case 'personnelPayment':
                if (!payeeId) { alert('Lütfen bir personel seçin.'); return; }
                // FIX: Add payer and paymentMethod to the new payment object.
                onAddPersonnelPayment({ personnelId: payeeId, amount: numericAmount, date, payer, paymentMethod });
                break;
        }
        onClose();
    };

    const typeConfig = {
        income: { title: 'Gelir', color: 'green', icon: ArrowUpCircleIcon },
        expense: { title: 'Gider', color: 'red', icon: ArrowDownCircleIcon },
        personnelPayment: { title: 'Personel Ödemesi', color: 'purple', icon: UserGroupIcon },
    };
    
    const isPayment = type === 'personnelPayment';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Yeni İşlem Ekle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <span className="block text-sm font-medium text-gray-700 mb-2">İşlem Tipi</span>
                        <div className="grid grid-cols-3 gap-2">
                             {(Object.keys(typeConfig) as TransactionType[]).map((key) => {
                                const config = typeConfig[key];
                                const isSelected = type === key;
                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        onClick={() => { setType(key); setPayeeId(''); }}
                                        className={`flex items-center justify-center p-3 rounded-md border text-sm font-medium transition-colors ${isSelected ? `bg-${config.color}-600 text-white border-${config.color}-600` : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <config.icon className={`h-5 w-5 mr-2`} />
                                        {config.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {isPayment ? (
                            <div>
                                <label htmlFor="payee" className="block text-sm font-medium text-gray-700">Alıcı</label>
                                <select id="payee" value={payeeId} onChange={e => setPayeeId(e.target.value)} required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option value="" disabled>
                                        Personel Seçin...
                                    </option>
                                    {allPersonnel.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Açıklama</label>
                                <input
                                    type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder={type === 'income' ? 'Örn: Hurda Malzeme Satışı' : 'Örn: Malzeme Alımı'}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}
                        {/* FIX: Add inputs for payer and paymentMethod when type is personnelPayment. */}
                        {type === 'personnelPayment' && (
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="payer" className="block text-sm font-medium text-gray-700">Ödeyen</label>
                                    <select id="payer" value={payer} onChange={e => setPayer(e.target.value as Payer)} required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="Kasa">Kasa</option>
                                        <option value="Ömer">Ömer</option>
                                        <option value="Barış">Barış</option>
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                                    <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="cash">Nakit</option>
                                        <option value="transfer">Havale</option>
                                        <option value="card">Kart</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Tutar (₺)</label>
                            <input
                                type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required
                                placeholder="0.00"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            İptal
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-${typeConfig[type].color}-600 hover:bg-${typeConfig[type].color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${typeConfig[type].color}-500`}
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const FinanceView: React.FC<FinanceViewProps> = (props) => {
    const { incomes, expenses, onDeleteIncome, onDeleteExpense, selectedMonth } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'income' | 'expense', description: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const transactions = useMemo(() => {
        const currentMonth = selectedMonth.getMonth();
        const currentYear = selectedMonth.getFullYear();

        const filterByMonth = (item: Income | Expense) => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        };

        const combined = [
            ...incomes.filter(filterByMonth).map(item => ({ ...item, type: 'income' as const })),
            ...expenses.filter(filterByMonth).map(item => ({ ...item, type: 'expense' as const })),
        ];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incomes, expenses, selectedMonth]);

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        return transactions.filter(t =>
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    }
    
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    const handleDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'income') {
            onDeleteIncome(itemToDelete.id);
        } else {
            onDeleteExpense(itemToDelete.id);
        }
        setItemToDelete(null);
    };

    return (
        <div className="relative min-h-[calc(100vh-150px)]">
            <h2 className="text-3xl font-bold mb-6 text-gray-700">Finans Yönetimi ({selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })})</h2>
            
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Aylık Ek Gelir & Giderler</h3>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Açıklamaya göre ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <ul className="divide-y divide-gray-200">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(item => {
                            const isIncome = item.type === 'income';
                            return (
                                <li key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                    <div className="flex items-center">
                                        {isIncome ? (
                                            <ArrowUpCircleIcon className="h-8 w-8 text-green-500 mr-4" />
                                        ) : (
                                            <ArrowDownCircleIcon className="h-8 w-8 text-red-500 mr-4" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.description}</p>
                                            <p className="text-sm text-gray-500">{formatDateTime(item.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                                        </p>
                                        <button 
                                            onClick={() => setItemToDelete({id: item.id, type: item.type, description: item.description})}
                                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="İşlemi Sil"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-10">
                            {transactions.length > 0 && searchQuery ? (
                                <>
                                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                    <p className="text-gray-500 font-medium">Sonuç Bulunamadı</p>
                                    <p className="text-sm text-gray-400">'{searchQuery}' için işlem bulunamadı.</p>
                                </>
                            ) : (
                                <>
                                    <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                    <p className="text-gray-500 font-medium">İşlem Bulunmuyor</p>
                                    <p className="text-sm text-gray-400">Bu ay için herhangi bir gelir veya gider kaydedilmedi.</p>
                                </>
                            )}
                        </div>
                    )}
                </ul>
            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110"
                aria-label="Yeni İşlem Ekle"
            >
                <PlusIcon className="h-8 w-8" />
            </button>

            <AddTransactionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...props}
            />

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                title="İşlemi Sil"
                message={`'${itemToDelete?.description}' işlemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            />
        </div>
    );
};

export default FinanceView;