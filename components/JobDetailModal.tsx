import React, { useMemo } from 'react';
import { CustomerJob, Personnel, Material, JobPersonnelPayment, PaymentMethod } from '../types';
import { XMarkIcon, PencilIcon, TrashIcon } from './icons/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

interface JobDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (job: CustomerJob) => void;
    onDelete?: (job: CustomerJob) => void;
    job: CustomerJob | null;
    personnel: Personnel[];
    isEditable: boolean;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, onEdit, onDelete, job, personnel, isEditable }) => {

    if (!isOpen || !job) return null;

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });

    const formatIncome = (job: CustomerJob): string => {
        if (job.incomePaymentMethod === 'GOLD') {
            const goldTypes = { gram: 'Gram', quarter: 'Çeyrek', full: 'Tam' };
            const type = job.incomeGoldType ? goldTypes[job.incomeGoldType] : '';
            return `${job.income} ${type} Altın`;
        }
        if (job.incomePaymentMethod === 'USD') {
             return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(job.income);
        }
        if (job.incomePaymentMethod === 'EUR') {
            return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(job.income);
        }
        // Default to TRY
        return formatCurrency(job.income);
    }

    // FIX: Added explicit types to `reduce` callbacks to ensure correct type inference for cost calculation.
    const totalPersonnelCost = useMemo(() => job.personnelPayments.reduce((sum: number, p: JobPersonnelPayment) => sum + p.payment, 0), [job.personnelPayments]);
    // Fix: Corrected a typo where 's' was used instead of 'sum' for the accumulator.
    const totalMaterialCost = useMemo(() => job.materials.reduce((sum: number, m: Material) => sum + (m.quantity * m.unitPrice), 0), [job.materials]);
    const totalCost = totalPersonnelCost + totalMaterialCost;
    const netProfit = job.income - totalCost;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{job.location}</h3>
                            <p className="text-sm text-gray-500">{formatDate(job.date)}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-green-100 p-4 rounded-lg"><p className="text-sm font-medium text-green-800">Gelir</p><p className="text-2xl font-bold text-green-700">{formatIncome(job)}</p></div>
                            <div className="bg-red-100 p-4 rounded-lg"><p className="text-sm font-medium text-red-800">Toplam Maliyet</p><p className="text-2xl font-bold text-red-700">{formatCurrency(totalCost)}</p></div>
                            <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-blue-100' : 'bg-red-200'}`}><p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-800' : 'text-red-900'}`}>Net Kar</p><p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-red-800'}`}>{formatCurrency(netProfit)}</p></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">İş Detayları</h4>
                                <div>
                                    <dt className="text-gray-500 text-sm font-medium">İş Açıklaması:</dt>
                                    <dd className="mt-1 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{job.description}</dd>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">Maliyet Dökümü</h4>
                                <div className="space-y-3">
                                    <div>
                                        <h5 className="text-sm font-semibold text-gray-600 flex justify-between items-center">
                                            <span>Personel Maliyetleri</span>
                                            <span className="font-bold text-red-600">{formatCurrency(totalPersonnelCost)}</span>
                                        </h5>
                                        {totalPersonnelCost > 0 ? (
                                            <ul className="text-sm space-y-1 mt-1 max-h-24 overflow-y-auto pr-2">
                                                {job.personnelPayments.map(p => {
                                                    if (p.payment === 0) return null;
                                                    console.log('🔍 JobDetailModal - Personnel Payment:', p);
                                                    console.log('🔍 JobDetailModal - Personnel listesi:', personnel);
                                                    console.log('🔍 JobDetailModal - Aranan personnelId:', p.personnelId);
                                                    const foundPerson = personnel.find(per => per.id === p.personnelId);
                                                    console.log('🔍 JobDetailModal - Bulunan person:', foundPerson);
                                                    const personName = foundPerson?.name || 'Bilinmeyen';
                                                    return (
                                                        <li key={`cost-${p.personnelId}`} className="flex justify-between py-0.5">
                                                            <span className="text-gray-700">{personName}</span>
                                                            <span className="font-medium text-gray-800">{formatCurrency(p.payment)}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : <p className="text-xs text-center text-gray-400 py-2">Personel maliyeti yok.</p>}
                                    </div>
                                    {job.materials.length > 0 && (
                                        <div className="border-t pt-3 mt-3">
                                            <h5 className="text-sm font-semibold text-gray-600 flex justify-between items-center">
                                                <span>Malzeme Maliyetleri</span>
                                                <span className="font-bold text-red-600">{formatCurrency(totalMaterialCost)}</span>
                                            </h5>
                                            <ul className="text-sm space-y-1 mt-1 max-h-24 overflow-y-auto pr-2">
                                                {job.materials.map(m => {
                                                    const cost = m.quantity * m.unitPrice;
                                                    return (
                                                        <li key={`cost-${m.id}`} className="flex justify-between py-0.5">
                                                            <span className="text-gray-700">{m.name}</span>
                                                            <span className="font-medium text-gray-800">{formatCurrency(cost)}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Çalışan Personeller ve Hakedişleri</h4>
                                <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                                    {job.personnelIds.map(pId => {
                                        console.log('🔍 JobDetailModal - PersonnelId:', pId);
                                        console.log('🔍 JobDetailModal - PersonnelIds array:', job.personnelIds);
                                        const paymentInfo = job.personnelPayments.find(p => p.personnelId === pId);
                                        const payment = paymentInfo?.payment || 0;
                                        const days = paymentInfo?.daysWorked || 0;
                                        const method = paymentInfo?.paymentMethod ? `(${paymentMethodNames[paymentInfo.paymentMethod]})` : '';
                                        const foundPerson = personnel.find(per => per.id === pId);
                                        console.log('🔍 JobDetailModal - Aranan personnelId:', pId, 'Bulunan person:', foundPerson);
                                        return (
                                            <li key={pId} className="flex justify-between items-center">
                                                <span className="text-gray-600">{foundPerson?.name || 'Bilinmeyen'} ({days} gün)</span>
                                                <span className="font-semibold">{formatCurrency(payment)} <span className="text-xs text-gray-500 font-normal">{method}</span></span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                            {job.materials.length > 0 && <div className="bg-white p-4 rounded-lg border"><h4 className="text-md font-semibold text-gray-700 mb-2">Kullanılan Malzemeler</h4><ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{job.materials.map(m => <li key={m.id} className="grid grid-cols-3 gap-2"><span className="text-gray-600 col-span-2">{m.name}</span><span className="font-semibold text-right">{m.quantity}{m.unit ? ` ${m.unit}` : ''} x {formatCurrency(m.unitPrice)} = {formatCurrency(m.quantity*m.unitPrice)}</span></li>)}</ul></div>}
                        </div>
                    </div>
                    {isEditable && onEdit && onDelete && (
                        <div className="px-6 py-4 bg-gray-100 flex justify-between items-center rounded-b-xl border-t">
                             <button type="button" onClick={() => onDelete(job)} className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"><TrashIcon className="h-4 w-4 mr-2"/> Sil</button>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Kapat</button>
                                <button type="button" onClick={() => onEdit(job)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"><PencilIcon className="h-4 w-4 mr-2"/> Düzenle</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default JobDetailModal;