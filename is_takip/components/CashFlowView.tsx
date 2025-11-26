

import React, { useMemo, useState } from 'react';
import { Personnel, User, Income, Expense, PersonnelPayment } from '../types';
import { TrendingUpIcon, TrendingDownIcon, CashIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface CashFlowViewProps {
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  extraIncomes: Income[];
  extraExpenses: Expense[];
  selectedMonth: Date;
}

interface Transaction {
    id: string;
    date: string;
    type: 'Gelir' | 'Gider' | 'Personel Ödemesi';
    description: string;
    amountIn: number | null;
    amountOut: number | null;
}

const CashFlowView: React.FC<CashFlowViewProps> = ({ personnel, personnelPayments, extraIncomes, extraExpenses, selectedMonth }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    }
    
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    const { transactions, totalIncome, totalExpense, netFlow } = useMemo(() => {
        const currentMonth = selectedMonth.getMonth();
        const currentYear = selectedMonth.getFullYear();
        
        const isCurrentMonth = (dateString: string) => {
            const date = new Date(dateString);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        };

        const allTransactions: Transaction[] = [];

        // Add extra incomes
        extraIncomes.filter(inc => isCurrentMonth(inc.date)).forEach(inc => {
            allTransactions.push({
                id: `inc-${inc.id}`,
                date: inc.date,
                type: 'Gelir',
                description: inc.description,
                amountIn: inc.amount,
                amountOut: null,
            });
        });

        // Add extra expenses
        extraExpenses.filter(exp => isCurrentMonth(exp.date)).forEach(exp => {
            allTransactions.push({
                id: `exp-${exp.id}`,
                date: exp.date,
                type: 'Gider',
                description: exp.description,
                amountIn: null,
                amountOut: exp.amount,
            });
        });
        
        // Add personnel payments
        personnelPayments.filter(p => isCurrentMonth(p.date)).forEach(p => {
             const pers = personnel.find(per => per.id === p.personnelId);
             allTransactions.push({
                id: `ppay-${p.id}`,
                date: p.date,
                type: 'Personel Ödemesi',
                description: `Ödeme: ${pers?.name || 'Bilinmeyen Personel'}`,
                amountIn: null,
                amountOut: p.amount,
            });
        });
        
        const income = allTransactions.reduce((sum: number, t: Transaction) => sum + (t.amountIn || 0), 0);
        const expense = allTransactions.reduce((sum: number, t: Transaction) => sum + (t.amountOut || 0), 0);
        
        return {
            transactions: allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalIncome: income,
            totalExpense: expense,
            netFlow: income - expense,
        };

    }, [personnel, personnelPayments, extraIncomes, extraExpenses, selectedMonth]);

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        return transactions.filter(t =>
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    const typeStyles = {
        'Gelir': 'bg-green-100 text-green-800',
        'Gider': 'bg-red-100 text-red-800',
        'Personel Ödemesi': 'bg-purple-100 text-purple-800',
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-700">Nakit Akışı ({selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })})</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title="Toplam Gelen Para" 
                    value={formatCurrency(totalIncome)} 
                    icon={TrendingUpIcon}
                    color="green"
                />
                <StatCard 
                    title="Toplam Giden Para" 
                    value={formatCurrency(totalExpense)} 
                    icon={TrendingDownIcon}
                    color="red"
                />
                <StatCard 
                    title="Net Nakit Akışı" 
                    value={formatCurrency(netFlow)}
                    icon={CashIcon}
                    color={netFlow >= 0 ? "blue" : "red"}
                />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                 <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                     <h3 className="text-lg font-semibold text-gray-800">Finansal Hareketler</h3>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Açıklamaya göre ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-md bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="p-3 font-semibold text-gray-600">Tarih</th>
                                <th className="p-3 font-semibold text-gray-600">Tip</th>
                                <th className="p-3 font-semibold text-gray-600">Açıklama</th>
                                <th className="p-3 font-semibold text-gray-600 text-right">Gelen Tutar</th>
                                <th className="p-3 font-semibold text-gray-600 text-right">Giden Tutar</th>
                            </tr>
                        </thead>
                         <tbody>
                            {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                <tr key={t.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm text-gray-500">{formatDateTime(t.date)}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeStyles[t.type] || 'bg-gray-100 text-gray-800'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium text-gray-800">{t.description}</td>
                                    <td className="p-3 font-semibold text-green-600 text-right">
                                        {t.amountIn ? formatCurrency(t.amountIn) : '-'}
                                    </td>
                                     <td className="p-3 font-semibold text-red-600 text-right">
                                        {t.amountOut ? formatCurrency(t.amountOut) : '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5}>
                                         <div className="flex flex-col items-center justify-center text-center p-10">
                                             {transactions.length > 0 && searchQuery ? (
                                                <>
                                                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                                    <p className="text-gray-500 font-medium">Sonuç Bulunamadı</p>
                                                    <p className="text-sm text-gray-400">'{searchQuery}' için işlem bulunamadı.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mb-2"/>
                                                    <p className="text-gray-500 font-medium">Finansal Hareket Yok</p>
                                                    <p className="text-sm text-gray-400">Bu ay için herhangi bir işlem kaydedilmedi.</p>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CashFlowView;