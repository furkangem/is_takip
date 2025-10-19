import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Personnel, User, Role, PersonnelPayment, CustomerJob, Customer, JobPersonnelPayment, Payer, PaymentMethod } from '../types';
import { UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CreditCardIcon, XMarkIcon, BriefcaseIcon, BanknotesIcon, TrendingUpIcon, TrendingDownIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

type UnifiedTransaction = 
    | { type: 'earning'; id: string; date: string; amount: number; job: CustomerJob; earningInfo: JobPersonnelPayment }
    | { type: 'payment'; id: string; date: string; amount: number; payment: PersonnelPayment; job?: CustomerJob };

interface GroupedTransaction {
    type: 'group';
    id: string;
    date: string;
    job: CustomerJob;
    transactions: UnifiedTransaction[];
    totalIncome: number;
    totalExpense: number;
}


const AddPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentData: PersonnelPayment | Omit<PersonnelPayment, 'id'>) => void;
    personnel: Personnel;
    personnelJobs: CustomerJob[];
    paymentToEdit: PersonnelPayment | null;
}> = ({ isOpen, onClose, onSave, personnel, personnelJobs, paymentToEdit }) => {
    const [formData, setFormData] = useState({
        amount: '',
        jobId: '',
        payer: 'Kasa' as Payer,
        paymentMethod: 'cash' as PaymentMethod,
        date: new Date().toISOString(),
    });

    useEffect(() => {
        if (!isOpen) return;
        if (paymentToEdit) {
            setFormData({
                amount: String(paymentToEdit.amount),
                jobId: paymentToEdit.customerJobId || '',
                payer: paymentToEdit.payer,
                paymentMethod: paymentToEdit.paymentMethod,
                date: paymentToEdit.date,
            });
        } else {
            setFormData({
                amount: '',
                jobId: '',
                payer: 'Kasa',
                paymentMethod: 'cash',
                date: new Date().toISOString(),
            });
        }
    }, [isOpen, paymentToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Lütfen geçerli bir ödeme tutarı girin.');
            return;
        }
        
        const paymentData = {
            personnelId: personnel.id,
            amount: numericAmount,
            customerJobId: formData.jobId || undefined,
            date: formData.date,
            payer: formData.payer,
            paymentMethod: formData.paymentMethod,
        }

        if (paymentToEdit) {
            onSave({ ...paymentToEdit, ...paymentData });
        } else {
            onSave(paymentData);
        }

        onClose();
    };
    
    const commonInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{paymentToEdit ? 'Ödemeyi Düzenle' : 'Ödeme Ekle'}: {personnel.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700">Ödeme Tutarı (₺)</label>
                        <input type="number" id="payment-amount" value={formData.amount} onChange={(e) => setFormData(p => ({...p, amount: e.target.value}))} className={commonInputClass} required autoFocus placeholder="Örn: 5000" />
                    </div>
                     <div>
                        <label htmlFor="job-id" className="block text-sm font-medium text-gray-700">İş (Opsiyonel)</label>
                        <select id="job-id" value={formData.jobId} onChange={(e) => setFormData(p => ({...p, jobId: e.target.value}))} className={commonInputClass}>
                            <option value="">Genel Ödeme</option>
                            {personnelJobs.map(job => (
                                <option key={job.id} value={job.id}>{job.location} - {job.description}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="payer" className="block text-sm font-medium text-gray-700">Ödeyen</label>
                            <select id="payer" value={formData.payer} onChange={(e) => setFormData(p => ({...p, payer: e.target.value as Payer}))} className={commonInputClass}>
                                <option value="Kasa">Kasa</option>
                                <option value="Omer">Ömer</option>
                                <option value="Baris">Barış</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                            <select id="paymentMethod" value={formData.paymentMethod} onChange={(e) => setFormData(p => ({...p, paymentMethod: e.target.value as PaymentMethod}))} className={commonInputClass}>
                                <option value="cash">Nakit</option> <option value="transfer">Havale</option> <option value="card">Kart</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{paymentToEdit ? 'Güncelle' : 'Kaydet'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EarningEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: CustomerJob) => void;
    job: CustomerJob | null;
    personnelEarning: JobPersonnelPayment | null;
    personnel: Personnel;
}> = ({ isOpen, onClose, onSave, job, personnelEarning, personnel }) => {
    const [amount, setAmount] = useState('');
    
    useEffect(() => {
        if(isOpen && personnelEarning) {
            setAmount(String(personnelEarning.payment));
        }
    }, [isOpen, personnelEarning]);

    if (!isOpen || !job || !personnelEarning) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if(isNaN(numericAmount) || numericAmount < 0) {
            alert('Geçerli bir tutar girin.');
            return;
        }

        const updatedJob = {
            ...job,
            personnelPayments: job.personnelPayments.map(p => 
                p.personnelId === personnel.id ? { ...p, payment: numericAmount } : p
            ),
        };
        onSave(updatedJob);
        onClose();
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Hakediş Düzenle: {personnel.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                        <strong>İş:</strong> {job.location} - {job.description}
                    </p>
                    <div>
                        <label htmlFor="earning-amount" className="block text-sm font-medium text-gray-700">Hakediş Tutarı (₺)</label>
                        <input type="number" id="earning-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required autoFocus />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">Güncelle</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PersonnelStatementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel;
    personnelPayments: PersonnelPayment[];
    customerJobs: CustomerJob[];
    customers: Customer[];
    onAddPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
    onUpdatePayment: (payment: PersonnelPayment) => void;
    onDeletePayment: (paymentId: string) => void;
    onUpdateCustomerJob: (job: CustomerJob) => void;
    isEditable: boolean;
}> = ({ isOpen, onClose, personnel, personnelPayments, customerJobs, customers, onAddPayment, onUpdatePayment, onDeletePayment, onUpdateCustomerJob, isEditable }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<PersonnelPayment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<PersonnelPayment | null>(null);

    const [isEarningModalOpen, setIsEarningModalOpen] = useState(false);
    const [earningToEdit, setEarningToEdit] = useState<{ job: CustomerJob, earningInfo: JobPersonnelPayment } | null>(null);
    const [expandedGroups, setExpandedGroups] = useState(new Set<string>());

    if (!isOpen) return null;

    const handleOpenPaymentEditor = (payment: PersonnelPayment | null = null) => {
        setPaymentToEdit(payment);
        setIsPaymentModalOpen(true);
    };

    const handleOpenEarningEditor = (job: CustomerJob, earningInfo: JobPersonnelPayment) => {
        setEarningToEdit({ job, earningInfo });
        setIsEarningModalOpen(true);
    };

    const handleSavePayment = (paymentData: PersonnelPayment | Omit<PersonnelPayment, 'id'>) => {
        if ('id' in paymentData) {
            onUpdatePayment(paymentData);
        } else {
            onAddPayment(paymentData);
        }
    };
    
    const unifiedTransactions = useMemo((): UnifiedTransaction[] => {
        const earnings: UnifiedTransaction[] = [];
        customerJobs.forEach(job => {
            const earningInfo = job.personnelPayments.find(p => p.personnelId === personnel.id);
            if (earningInfo) {
                earnings.push({
                    type: 'earning',
                    id: `earning-${job.id}-${personnel.id}`,
                    date: job.date,
                    amount: earningInfo.payment,
                    job: job,
                    earningInfo: earningInfo,
                });
            }
        });

        const payments: UnifiedTransaction[] = personnelPayments
            .filter(p => p.personnelId === personnel.id)
            .map(p => ({
                type: 'payment',
                id: p.id,
                date: p.date,
                amount: p.amount,
                payment: p,
                job: customerJobs.find(j => j.id === p.customerJobId)
            }));
            
        return [...earnings, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [personnel, customerJobs, personnelPayments]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) newSet.delete(groupId);
            else newSet.add(groupId);
            return newSet;
        });
    };

    const groupedTransactions = useMemo(() => {
        const displayItems: (UnifiedTransaction | GroupedTransaction)[] = [];
        const processedIndices = new Set<number>();

        unifiedTransactions.forEach((transaction, index) => {
            if (processedIndices.has(index)) return;

            if ((transaction.type === 'earning' || (transaction.type === 'payment' && transaction.payment.customerJobId)) && transaction.job && transaction.date) {
                const groupDate = new Date(transaction.date).toISOString().split('T')[0];
                const groupId = `${transaction.job.id}-${groupDate}`;

                const groupMembers: UnifiedTransaction[] = [transaction];
                processedIndices.add(index);

                for (let i = index + 1; i < unifiedTransactions.length; i++) {
                    const otherTx = unifiedTransactions[i];
                    const otherTxDate = new Date(otherTx.date).toISOString().split('T')[0];
                    if (otherTxDate === groupDate && 
                        ((otherTx.type === 'earning' && otherTx.job?.id === transaction.job.id) || 
                         (otherTx.type === 'payment' && otherTx.payment.customerJobId === transaction.job.id))) {
                        groupMembers.push(otherTx);
                        processedIndices.add(i);
                    }
                }
                
                if (groupMembers.length > 1) {
                    const totalIncome = groupMembers.reduce((sum, item) => sum + (item.type === 'earning' ? item.amount : 0), 0);
                    const totalExpense = groupMembers.reduce((sum, item) => sum + (item.type === 'payment' ? item.amount : 0), 0);
                    displayItems.push({ type: 'group', id: groupId, date: transaction.date, job: transaction.job, transactions: groupMembers, totalIncome, totalExpense });
                } else {
                    displayItems.push(transaction);
                }
            } else {
                displayItems.push(transaction);
                processedIndices.add(index);
            }
        });
        return displayItems;
    }, [unifiedTransactions]);
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b shrink-0">
                        <div>
                           <h3 className="text-xl font-semibold text-gray-800 flex items-center"><ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-500" /> Hesap Ekstresi: {personnel.name}</h3>
                           <p className="text-sm text-gray-500 mt-1">Tüm hakediş ve ödeme geçmişi.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 font-semibold text-gray-600 w-32">Tarih</th>
                                    <th className="p-3 font-semibold text-gray-600">Açıklama</th>
                                    <th className="p-3 font-semibold text-gray-600 text-right w-32">Hakediş (+)</th>
                                    <th className="p-3 font-semibold text-gray-600 text-right w-32">Ödeme (-)</th>
                                    <th className="p-3 font-semibold text-gray-600 text-center w-20">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {groupedTransactions.length > 0 ? groupedTransactions.map((item) => {
                                    if (item.type === 'group') {
                                        const isExpanded = expandedGroups.has(item.id);
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr onClick={() => toggleGroup(item.id)} className="bg-slate-100 hover:bg-slate-200 cursor-pointer border-y border-slate-300">
                                                    <td className="p-3 text-sm text-gray-600 align-top"><div className="flex items-center font-semibold">{formatDate(item.date)}{isExpanded ? <ChevronUpIcon className="h-4 w-4 ml-2 text-gray-500"/> : <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-500"/>}</div></td>
                                                    <td className="p-3 font-medium text-gray-800">Toplu İşlem: {item.job.location}<p className="text-xs text-gray-500 font-normal">{item.job.description}</p></td>
                                                    <td className="p-3 text-sm text-green-600 font-bold text-right align-middle">{item.totalIncome > 0 ? formatCurrency(item.totalIncome) : '-'}</td>
                                                    <td className="p-3 text-sm text-red-600 font-bold text-right align-middle">{item.totalExpense > 0 ? formatCurrency(item.totalExpense) : '-'}</td>
                                                    <td className="p-3 w-20 text-center"><span className="text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-full">{item.transactions.length} işlem</span></td>
                                                </tr>
                                                {isExpanded && item.transactions.map(transaction => (
                                                    <tr key={transaction.id} className="bg-white hover:bg-gray-50 group">
                                                        {/* FIX: Wrapped icon components in a span to apply the `title` attribute, resolving a TypeScript error where the `title` prop was not recognized on the SVG component's props type. */}
                                                        <td className="p-3 text-sm text-gray-600 pl-8">{transaction.type === 'payment' ? <span title="Ödeme"><CreditCardIcon className="h-4 w-4 text-red-400" /></span> : <span title="Hakediş"><TrendingUpIcon className="h-4 w-4 text-green-400" /></span>}</td>
                                                        <td className="p-3">
                                                            {transaction.type === 'earning' && (<p className="font-medium text-gray-800">Hakediş: <span className="font-normal">{customers.find(c => c.id === transaction.job.customerId)?.name}</span></p>)}
                                                            {transaction.type === 'payment' && (<p className="font-medium text-gray-800">Ödeme Yapıldı<span className="font-normal text-xs text-gray-500"> ({transaction.payment.payer} - {paymentMethodNames[transaction.payment.paymentMethod]})</span></p>)}
                                                        </td>
                                                        <td className="p-3 text-sm text-green-600 font-semibold text-right">{transaction.type === 'earning' ? formatCurrency(transaction.amount) : '-'}</td>
                                                        <td className="p-3 text-sm text-red-600 font-semibold text-right">{transaction.type === 'payment' ? formatCurrency(transaction.amount) : '-'}</td>
                                                        <td className="p-3 w-20">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isEditable && transaction.type === 'earning' && (<button onClick={() => handleOpenEarningEditor(transaction.job, transaction.earningInfo)} className="p-1 text-gray-400 hover:text-blue-600" title="Hakedişi Düzenle"><PencilIcon className="h-4 w-4"/></button>)}
                                                                {isEditable && transaction.type === 'payment' && (<><button onClick={() => handleOpenPaymentEditor(transaction.payment)} className="p-1 text-gray-400 hover:text-blue-600" title="Ödemeyi Düzenle"><PencilIcon className="h-4 w-4"/></button><button onClick={() => setPaymentToDelete(transaction.payment)} className="p-1 text-gray-400 hover:text-red-600" title="Ödemeyi Sil"><TrashIcon className="h-4 w-4"/></button></>)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    } else {
                                        const transaction = item;
                                        return (
                                            <tr key={transaction.id} className="bg-white hover:bg-gray-50 group border-t">
                                                <td className="p-3 text-sm text-gray-600">{formatDate(transaction.date)}</td>
                                                <td className="p-3">
                                                    {transaction.type === 'earning' && (<><p className="font-medium text-gray-800">Hakediş: <span className="font-normal">{transaction.job.description}</span></p><p className="text-xs text-gray-500">{customers.find(c => c.id === transaction.job.customerId)?.name}</p></>)}
                                                    {transaction.type === 'payment' && (<><p className="font-medium text-gray-800">Ödeme Yapıldı {transaction.job ? `(${transaction.job.location})` : '(Genel)'}</p><p className="text-xs text-gray-500">Ödeyen: {transaction.payment.payer} &middot; {paymentMethodNames[transaction.payment.paymentMethod]}</p></>)}
                                                </td>
                                                <td className="p-3 text-sm text-green-600 font-semibold text-right">{transaction.type === 'earning' ? formatCurrency(transaction.amount) : '-'}</td>
                                                <td className="p-3 text-sm text-red-600 font-semibold text-right">{transaction.type === 'payment' ? formatCurrency(transaction.amount) : '-'}</td>
                                                <td className="p-3 w-20">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isEditable && transaction.type === 'earning' && (<button onClick={() => handleOpenEarningEditor(transaction.job, transaction.earningInfo)} className="p-1 text-gray-400 hover:text-blue-600" title="Hakedişi Düzenle"><PencilIcon className="h-4 w-4"/></button>)}
                                                        {isEditable && transaction.type === 'payment' && (<><button onClick={() => handleOpenPaymentEditor(transaction.payment)} className="p-1 text-gray-400 hover:text-blue-600" title="Ödemeyi Düzenle"><PencilIcon className="h-4 w-4"/></button><button onClick={() => setPaymentToDelete(transaction.payment)} className="p-1 text-gray-400 hover:text-red-600" title="Ödemeyi Sil"><TrashIcon className="h-4 w-4"/></button></>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                }) : (
                                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Bu personel için finansal kayıt bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-lg border-t shrink-0">
                         <p className="text-sm text-gray-600">Yeni bir ödeme veya hakediş ekleyebilirsiniz.</p>
                        {isEditable && <button onClick={() => handleOpenPaymentEditor()} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm"><CreditCardIcon className="h-5 w-5 mr-2" /> Yeni Ödeme Ekle</button>}
                    </div>
                </div>
            </div>

            <Suspense fallback={null}>
                {isPaymentModalOpen && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} personnel={personnel} personnelJobs={customerJobs.filter(job => job.personnelIds.includes(personnel.id))} paymentToEdit={paymentToEdit} />}
                {paymentToDelete && <ConfirmationModal isOpen={!!paymentToDelete} onClose={() => setPaymentToDelete(null)} onConfirm={() => { if(paymentToDelete) onDeletePayment(paymentToDelete.id); setPaymentToDelete(null); }} title="Ödemeyi Sil" message={`${formatDateTime(paymentToDelete.date)} tarihli ${formatCurrency(paymentToDelete.amount)} tutarındaki ödemeyi silmek istediğinizden emin misiniz?`} />}
                {earningToEdit && <EarningEditorModal isOpen={isEarningModalOpen} onClose={() => setIsEarningModalOpen(false)} onSave={onUpdateCustomerJob} job={earningToEdit.job} personnelEarning={earningToEdit.earningInfo} personnel={personnel} />}
            </Suspense>
        </>
    );
};

const PersonnelLedgerView: React.FC<{
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnelPayments: PersonnelPayment[];
  onAddPersonnelPayment: (payment: Omit<PersonnelPayment, 'id'>) => void;
  onUpdatePersonnelPayment: (payment: PersonnelPayment) => void;
  onDeletePersonnelPayment: (paymentId: string) => void;
  onUpdateCustomerJob: (job: CustomerJob) => void;
  isEditable: boolean;
}> = (props) => {
    const { personnel, customers, customerJobs, personnelPayments, onAddPersonnelPayment, onUpdatePersonnelPayment, onDeletePersonnelPayment, onUpdateCustomerJob, isEditable } = props;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'balance' | 'earnings' | 'id'>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [statementModalOpen, setStatementModalOpen] = useState(false);
    const [selectedPersonnelForStatement, setSelectedPersonnelForStatement] = useState<Personnel | null>(null);

    const personnelFinancials = useMemo(() => {
        return personnel.map(p => {
            const jobs = customerJobs.filter(job => job.personnelIds.includes(p.id));
            const earnings = jobs.reduce((sum, job) => {
                const earningInfo = job.personnelPayments.find(pp => pp.personnelId === p.id);
                return sum + (earningInfo?.payment || 0);
            }, 0);
            const payments = personnelPayments.filter(pp => pp.personnelId === p.id);
            const totalPaid = payments.reduce((sum, pp) => sum + pp.amount, 0);
            const balance = earnings - totalPaid;
            return { ...p, earnings, totalPaid, balance };
        });
    }, [personnel, customerJobs, personnelPayments]);

    const filteredAndSortedPersonnel = useMemo(() => {
        const filtered = personnelFinancials.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return filtered.sort((a, b) => {
            let compare = 0;
            if (sortBy === 'name') compare = a.name.localeCompare(b.name, 'tr');
            else if (sortBy === 'balance') compare = a.balance - b.balance;
            else if (sortBy === 'earnings') compare = a.earnings - b.earnings;
            else if (sortBy === 'id') compare = a.id - b.id; // ID'ye göre sıralama eklendi
            else compare = b.id - a.id; // Varsayılan: en yeni üstte (ID'ye göre)
            return sortDirection === 'asc' ? compare : -compare;
        });
    }, [personnelFinancials, searchQuery, sortBy, sortDirection]);

    const handleSort = (key: 'name' | 'balance' | 'earnings' | 'id') => {
        if (sortBy === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('asc');
        }
    };
    
    const handleOpenStatement = (person: Personnel) => {
        setSelectedPersonnelForStatement(person);
        setStatementModalOpen(true);
    };

    const SortableHeader: React.FC<{ sortKey: 'name' | 'balance' | 'earnings' | 'id', children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="p-3 font-semibold cursor-pointer" onClick={() => handleSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {sortBy === sortKey && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
            </div>
        </th>
    );

    const totalBalance = personnelFinancials.reduce((sum, p) => sum + p.balance, 0);
    const totalEarnings = personnelFinancials.reduce((sum, p) => sum + p.earnings, 0);
    const totalPaid = personnelFinancials.reduce((sum, p) => sum + p.totalPaid, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Toplam Hakediş" value={formatCurrency(totalEarnings)} icon={TrendingUpIcon} color="green" />
                 <StatCard title="Toplam Ödenen" value={formatCurrency(totalPaid)} icon={TrendingDownIcon} color="red" />
                 <StatCard title="Genel Bakiye" value={formatCurrency(totalBalance)} icon={CurrencyDollarIcon} color={totalBalance >= 0 ? 'blue' : 'red'} />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute h-5 w-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Personel ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full max-w-sm pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <SortableHeader sortKey="name">Personel</SortableHeader>
                                <SortableHeader sortKey="earnings">Toplam Hakediş</SortableHeader>
                                <th className="p-3 font-semibold">Toplam Ödenen</th>
                                <SortableHeader sortKey="balance">Kalan Bakiye</SortableHeader>
                                <th className="p-3 font-semibold text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredAndSortedPersonnel.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-medium text-gray-800">{p.name}</td>
                                    <td className="p-3 text-gray-600">{formatCurrency(p.earnings)}</td>
                                    <td className="p-3 text-gray-600">{formatCurrency(p.totalPaid)}</td>
                                    <td className={`p-3 font-bold ${p.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(p.balance)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleOpenStatement(p)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md">
                                            Detay Görüntüle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Suspense fallback={null}>
                {statementModalOpen && selectedPersonnelForStatement && (
                    <PersonnelStatementModal 
                        isOpen={statementModalOpen}
                        onClose={() => setStatementModalOpen(false)}
                        personnel={selectedPersonnelForStatement}
                        customers={customers}
                        customerJobs={customerJobs}
                        personnelPayments={personnelPayments}
                        onAddPayment={onAddPersonnelPayment}
                        onUpdatePayment={onUpdatePersonnelPayment}
                        onDeletePayment={onDeletePersonnelPayment}
                        onUpdateCustomerJob={onUpdateCustomerJob}
                        isEditable={isEditable}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default PersonnelLedgerView;