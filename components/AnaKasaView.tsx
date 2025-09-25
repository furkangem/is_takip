import React, { useState, useMemo } from 'react';
import { Customer, CustomerJob, Personnel, PersonnelPayment, DefterEntry, SharedExpense, Material, JobPersonnelPayment } from '../types';
import { TrendingUpIcon, TrendingDownIcon, CashIcon, MagnifyingGlassIcon } from './icons/Icons';
import StatCard from './ui/StatCard';
import JobDetailModal from './JobDetailModal';

type View = 'personnel' | 'customers' | 'kasa' | 'timesheet';

interface AnaKasaViewProps {
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  defterEntries: DefterEntry[];
  sharedExpenses: SharedExpense[];
  onNavigate: (view: View, id: string) => void;
}

interface UnifiedTransaction {
  id: string;
  date: string;
  description: string;
  type: string;
  amountIn: number | null;
  amountOut: number | null;
  navigateToView: View;
  navigateToId: string;
  jobId?: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

const AnaKasaView: React.FC<AnaKasaViewProps> = (props) => {
    const { customers, customerJobs, personnel, personnelPayments, defterEntries, sharedExpenses, onNavigate } = props;
    const [searchQuery, setSearchQuery] = useState('');
    const [jobToView, setJobToView] = useState<CustomerJob | null>(null);
    const [selectedType, setSelectedType] = useState<string>('all');

    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(formatDateForInput(firstDayOfMonth));
    const [endDate, setEndDate] = useState(formatDateForInput(today));

    const allTransactions = useMemo((): UnifiedTransaction[] => {
        const transactions: UnifiedTransaction[] = [];

        // 1. From Customer Jobs
        customerJobs.forEach(job => {
            const customer = customers.find(c => c.id === job.customerId);
            const descriptionPrefix = `${customer?.name || 'Bilinmeyen Müşteri'} - ${job.location}`;

            // Job Income
            if (job.income > 0) {
                 transactions.push({
                    id: `job-income-${job.id}`,
                    date: job.date,
                    description: `${descriptionPrefix} (İş Geliri)`,
                    type: 'İş Geliri',
                    amountIn: job.income,
                    amountOut: null,
                    navigateToView: 'customers',
                    navigateToId: job.customerId,
                    jobId: job.id,
                });
            }
           
            // Personnel Costs from Job
            const totalPersonnelCost = job.personnelPayments.reduce((sum: number, p: JobPersonnelPayment) => sum + p.payment, 0);
            if (totalPersonnelCost > 0) {
                transactions.push({
                    id: `job-personnel-${job.id}`,
                    date: job.date,
                    description: `${descriptionPrefix} (Personel Maliyeti)`,
                    type: 'Personel Maliyeti',
                    amountIn: null,
                    amountOut: totalPersonnelCost,
                    navigateToView: 'customers',
                    navigateToId: job.customerId,
                    jobId: job.id,
                });
            }
            
            // Material Costs from Job
            const totalMaterialCost = job.materials.reduce((sum: number, m: Material) => sum + (m.quantity * m.unitPrice), 0);
            if (totalMaterialCost > 0) {
                 transactions.push({
                    id: `job-material-${job.id}`,
                    date: job.date,
                    description: `${descriptionPrefix} (Malzeme Maliyeti)`,
                    type: 'Malzeme Maliyeti',
                    amountIn: null,
                    amountOut: totalMaterialCost,
                    navigateToView: 'customers',
                    navigateToId: job.customerId,
                    jobId: job.id,
                });
            }
        });
        
        // 2. From Defter Entries (only paid ones)
        defterEntries.filter(entry => entry.status === 'paid').forEach(entry => {
            transactions.push({
                id: `defter-${entry.id}`,
                date: entry.paidDate || entry.date,
                description: entry.description,
                type: 'Defter Kaydı',
                amountIn: entry.type === 'income' ? entry.amount : null,
                amountOut: entry.type === 'expense' ? entry.amount : null,
                navigateToView: 'kasa',
                navigateToId: entry.id, // For future deep linking
            });
        });
        
        // 4. From Direct Personnel Payments (not linked to a job)
        personnelPayments.filter(p => !p.customerJobId).forEach(p => {
             const person = personnel.find(per => per.id === p.personnelId);
             transactions.push({
                id: `direct-payment-${p.id}`,
                date: p.date,
                description: `Direkt Ödeme: ${person?.name || 'Bilinmeyen Personel'}`,
                type: 'Personel Avans/Ödeme',
                amountIn: null,
                amountOut: p.amount,
                navigateToView: 'personnel',
                navigateToId: p.personnelId,
            });
        });


        return transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customerJobs, customers, defterEntries, personnelPayments, personnel]);
    
    const transactionsInDateRange = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) start.setHours(0,0,0,0);
        if (end) end.setHours(23,59,59,999);
        
        return allTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;
            return true;
        });
    }, [allTransactions, startDate, endDate]);
    
    const transactionTypes = useMemo(() => {
        return Array.from(new Set(transactionsInDateRange.map(t => t.type)));
    }, [transactionsInDateRange]);


    const filteredTransactions = useMemo(() => {
        let transactions = transactionsInDateRange;

        if (searchQuery) {
            transactions = transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (selectedType !== 'all') {
            transactions = transactions.filter(t => t.type === selectedType);
        }
        
        return transactions;
    }, [transactionsInDateRange, searchQuery, selectedType]);
    
    const totals = useMemo(() => {
        return transactionsInDateRange.reduce((acc, t) => {
            acc.income += t.amountIn || 0;
            acc.expense += t.amountOut || 0;
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactionsInDateRange]);
    
    const handleDetailsClick = (transaction: UnifiedTransaction) => {
        if (transaction.jobId) {
            const job = customerJobs.find(j => j.id === transaction.jobId);
            if (job) {
                setJobToView(job);
            }
        } else {
            onNavigate(transaction.navigateToView, transaction.navigateToId);
        }
    };

    const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Toplam Gelir" value={formatCurrency(totals.income)} icon={TrendingUpIcon} color="green" />
                <StatCard title="Toplam Gider" value={formatCurrency(totals.expense)} icon={TrendingDownIcon} color="red" />
                <StatCard title="Net Akış" value={formatCurrency(totals.income - totals.expense)} icon={CashIcon} color={totals.income >= totals.expense ? 'blue' : 'red'} />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputClass} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Açıklamada Ara</label>
                         <div className="relative">
                            <MagnifyingGlassIcon className="absolute h-5 w-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Filtrele..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${commonInputClass} pl-10`} />
                         </div>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi</label>
                         <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className={commonInputClass}>
                            <option value="all">Tüm Tipler</option>
                            {transactionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                         </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-3 font-semibold">Tarih</th>
                                <th className="p-3 font-semibold">Açıklama</th>
                                <th className="p-3 font-semibold">Tip</th>
                                <th className="p-3 font-semibold text-right">Gelir</th>
                                <th className="p-3 font-semibold text-right">Gider</th>
                                <th className="p-3 font-semibold text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50">
                                    <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="p-3 font-medium text-gray-800 max-w-xs truncate" title={t.description}>{t.description}</td>
                                    <td className="p-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{t.type}</span></td>
                                    <td className="p-3 font-bold text-green-600 text-right">{t.amountIn ? formatCurrency(t.amountIn) : '-'}</td>
                                    <td className="p-3 font-bold text-red-600 text-right">{t.amountOut ? formatCurrency(t.amountOut) : '-'}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleDetailsClick(t)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md">
                                            Detaylar
                                        </button>
                                    </td>
                                </tr>
                             )) : (
                                 <tr><td colSpan={6} className="text-center p-6 text-gray-500">Seçilen kriterlere uygun işlem bulunamadı.</td></tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
            <JobDetailModal
                isOpen={!!jobToView}
                onClose={() => setJobToView(null)}
                job={jobToView}
                personnel={personnel}
                isEditable={false}
            />
        </div>
    );
};

export default AnaKasaView;