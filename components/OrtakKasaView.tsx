

import React, { useState, useMemo } from 'react';
import { SharedExpense, Payer, PaymentMethod } from '../types';
import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon, BanknotesIcon, CashIcon, CreditCardIcon, ArrowsRightLeftIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';
import StatCard from './ui/StatCard';

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDateTime = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const paymentMethodIcons: Record<PaymentMethod, React.ElementType> = { cash: CashIcon, card: CreditCardIcon, transfer: ArrowsRightLeftIcon };
const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

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

    React.useEffect(() => {
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

interface OrtakKasaViewProps {
    expenses: SharedExpense[];
    onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
    onUpdate: (expense: SharedExpense) => void;
    onDelete: (expenseId: string) => void;
    isReadOnly?: boolean;
}

const OrtakKasaView: React.FC<OrtakKasaViewProps> = ({ expenses, onAdd, onUpdate, onDelete, isReadOnly }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SharedExpense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<SharedExpense | null>(null);

    const handleSaveExpense = (data: SharedExpense | Omit<SharedExpense, 'id'>) => { 'id' in data ? onUpdate(data) : onAdd(data) };
    const handleToggleStatus = (expense: SharedExpense) => onUpdate({ ...expense, status: expense.status === 'unpaid' ? 'paid' : 'unpaid' });
    
    const { omerBalance, barisBalance, kasaBalance } = useMemo(() => {
        let omer = 0;
        let baris = 0;
        let kasa = 0;
        expenses.forEach(exp => {
            if (exp.status === 'paid') {
                if (exp.payer === 'Ömer') omer += exp.amount;
                else if (exp.payer === 'Barış') baris += exp.amount;
                else if (exp.payer === 'Kasa') kasa += exp.amount;
            }
        });
        const total = omer + baris + kasa;
        const perPersonShare = total / 2;
        
        return {
            omerBalance: omer - perPersonShare,
            barisBalance: baris - perPersonShare,
            kasaBalance: kasa
        }
    }, [expenses]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Ömer Bakiye" value={formatCurrency(omerBalance)} icon={BanknotesIcon} color={omerBalance >= 0 ? 'green' : 'red'} />
                <StatCard title="Barış Bakiye" value={formatCurrency(barisBalance)} icon={BanknotesIcon} color={barisBalance >= 0 ? 'green' : 'red'} />
                <StatCard title="Kasadan Ödenen" value={formatCurrency(kasaBalance)} icon={CashIcon} color="blue" />
            </div>
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
                            {expenses.length > 0 ? expenses.map(exp => { 
                                const PaymentIcon = paymentMethodIcons[exp.paymentMethod]; 
                                return (
                                    <tr key={exp.id} className="group hover:bg-gray-50">
                                        <td className="p-3"><button onClick={() => !isReadOnly && handleToggleStatus(exp)} disabled={isReadOnly} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${exp.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}>{exp.status === 'paid' ? 'Ödendi' : 'Ödenmedi'}</button></td>
                                        <td className="p-3 font-medium text-gray-800">{exp.description}</td>
                                        <td className="p-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                                        <td className="p-3 hidden md:table-cell text-gray-600">{exp.payer}</td>
                                        <td className="p-3 hidden md:table-cell"><span className="flex items-center gap-1.5 text-gray-600"><PaymentIcon className="h-4 w-4"/> {paymentMethodNames[exp.paymentMethod]}</span></td>
                                        <td className="p-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{formatDateTime(exp.date)}</td>
                                        <td className="p-3 text-right">
                                            {!isReadOnly && <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => {setExpenseToEdit(exp); setIsModalOpen(true);}} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="h-4 w-4"/></button>
                                                <button onClick={() => setExpenseToDelete(exp)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4"/></button>
                                            </div>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <SharedExpenseEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} expenseToEdit={expenseToEdit} />
            <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if(expenseToDelete) onDelete(expenseToDelete.id); setExpenseToDelete(null); }} title="Gideri Sil" message={`'${expenseToDelete?.description}' giderini silmek istediğinizden emin misiniz?`}/>
        </div>
    );
}

export default OrtakKasaView;