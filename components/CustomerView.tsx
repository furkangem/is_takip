import React, { useState, useMemo, useEffect } from 'react';
import { Customer, CustomerJob, Personnel, Material, JobPersonnelPayment, IncomePaymentMethod, GoldType } from '../types';
import { BuildingOffice2Icon, IdentificationIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CashIcon, TrendingUpIcon, TrendingDownIcon, ChevronUpIcon, ChevronDownIcon, UsersIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';
import StatCard from './ui/StatCard';

// FIX: Define formatCurrency in the module scope to be accessible by all components in this file.
const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

interface CustomerViewProps {
  customers: Customer[];
  customerJobs: CustomerJob[];
  personnel: Personnel[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddCustomerJob: (job: Omit<CustomerJob, 'id'>) => void;
  onUpdateCustomerJob: (job: CustomerJob) => void;
  onDeleteCustomerJob: (jobId: string) => void;
  navigateToId: string | null;
  onNavigationComplete: () => void;
}

const CustomerEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Customer | Omit<Customer, 'id'>) => void;
    customerToEdit: Customer | null;
}> = ({ isOpen, onClose, onSave, customerToEdit }) => {
    const [name, setName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [address, setAddress] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (customerToEdit) {
                setName(customerToEdit.name);
                setContactInfo(customerToEdit.contactInfo);
                setAddress(customerToEdit.address);
                setJobDescription(customerToEdit.jobDescription);
            } else {
                setName('');
                setContactInfo('');
                setAddress('');
                setJobDescription('');
            }
        }
    }, [isOpen, customerToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Lütfen müşteri ismini girin.');
            return;
        }
        const customerData = { name, contactInfo, address, jobDescription };
        if (customerToEdit) {
            onSave({ ...customerToEdit, ...customerData });
        } else {
            onSave(customerData);
        }
        onClose();
    };
    
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{customerToEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="customer-name" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <IdentificationIcon className="h-4 w-4 mr-2 text-gray-500"/> Müşteri İsmi
                        </label>
                        <input type="text" id="customer-name" value={name} onChange={e => setName(e.target.value)} required className={commonInputClass} />
                    </div>
                    <div>
                        <label htmlFor="customer-contact" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                           <PhoneIcon className="h-4 w-4 mr-2 text-gray-500"/> İletişim Bilgisi (Telefon, E-posta)
                        </label>
                        <input type="text" id="customer-contact" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className={commonInputClass} />
                    </div>
                     <div>
                        <label htmlFor="customer-address" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                           <MapPinIcon className="h-4 w-4 mr-2 text-gray-500"/> Adres
                        </label>
                        <input type="text" id="customer-address" value={address} onChange={e => setAddress(e.target.value)} className={commonInputClass} />
                    </div>
                    <div>
                         <label htmlFor="customer-desc" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                           <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500"/> Genel İş Tanımı
                         </label>
                        <textarea id="customer-desc" value={jobDescription} onChange={e => setJobDescription(e.target.value)} className={commonInputClass} rows={3}></textarea>
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

const JobEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: Omit<CustomerJob, 'id'> | CustomerJob) => void;
    jobToEdit: CustomerJob | null;
    customerId: string;
    personnel: Personnel[];
    initialLocation?: string;
}> = ({ isOpen, onClose, onSave, jobToEdit, customerId, personnel, initialLocation }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        description: '',
        income: '',
        incomePaymentMethod: 'TRY' as IncomePaymentMethod,
        incomeGoldType: 'gram' as GoldType,
        otherExpenses: '',
    });

    const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
    const [personnelPayments, setPersonnelPayments] = useState<Map<string, string>>(new Map());
    const [materials, setMaterials] = useState<Omit<Material, 'id'>[]>([]);
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [personnelSearch, setPersonnelSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (jobToEdit) {
                setFormData({
                    date: jobToEdit.date,
                    location: jobToEdit.location,
                    description: jobToEdit.description,
                    income: String(jobToEdit.income || ''),
                    incomePaymentMethod: jobToEdit.incomePaymentMethod || 'TRY',
                    incomeGoldType: jobToEdit.incomeGoldType || 'gram',
                    otherExpenses: String(jobToEdit.otherExpenses || ''),
                });
                setSelectedPersonnelIds(jobToEdit.personnelIds || []);
                setMaterials(jobToEdit.materials.map(({id, ...rest}) => rest) || []);
                const paymentsMap = new Map<string, string>();
                jobToEdit.personnelPayments.forEach(p => paymentsMap.set(p.personnelId, String(p.payment)));
                setPersonnelPayments(paymentsMap);
            } else {
                 setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: initialLocation || '',
                    description: '', 
                    income: '', 
                    incomePaymentMethod: 'TRY',
                    incomeGoldType: 'gram',
                    otherExpenses: '',
                });
                setSelectedPersonnelIds([]);
                setMaterials([]);
                setPersonnelPayments(new Map());
            }
            setPersonnelSearch('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, jobToEdit, initialLocation]);
    
    const totalPersonnelPayment = useMemo(() => {
        return Array.from(personnelPayments.values()).reduce((sum, payment) => sum + (parseFloat(payment) || 0), 0);
    }, [personnelPayments]);

    const totalMaterialCost = useMemo(() => {
        return materials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
    }, [materials]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePersonnelSelect = (personnelId: string) => {
        const newIds = new Set(selectedPersonnelIds);
        if (newIds.has(personnelId)) {
            newIds.delete(personnelId);
        } else {
            newIds.add(personnelId);
        }
        setSelectedPersonnelIds(Array.from(newIds));
    };
    
    const handlePaymentChange = (personnelId: string, value: string) => {
        setPersonnelPayments(prev => new Map(prev).set(personnelId, value));
    };

    const handleAddMaterial = () => {
        setMaterials(prev => [...prev, { name: '', unit: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleMaterialChange = (index: number, field: keyof Omit<Material, 'id'>, value: string) => {
        const newMaterials = [...materials];
        const material = { ...newMaterials[index] };

        if (field === 'name' || field === 'unit') {
            material[field] = value;
        } else if (field === 'quantity' || field === 'unitPrice') {
            const numValue = parseFloat(value);
            (material as any)[field] = isNaN(numValue) ? 0 : numValue;
        }
        
        newMaterials[index] = material;
        setMaterials(newMaterials);
    };

    const handleRemoveMaterial = (index: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const jobData = {
            customerId,
            date: formData.date,
            location: formData.location,
            description: formData.description,
            income: parseFloat(formData.income) || 0,
            incomePaymentMethod: formData.incomePaymentMethod,
            incomeGoldType: formData.incomePaymentMethod === 'GOLD' ? formData.incomeGoldType : undefined,
            otherExpenses: parseFloat(formData.otherExpenses) || 0,
            personnelIds: selectedPersonnelIds,
            personnelPayments: Array.from(personnelPayments.entries())
                .filter(([_, payment]) => (parseFloat(payment) || 0) > 0)
                .map(([personnelId, payment]) => ({ personnelId, payment: parseFloat(payment) })),
            materials: materials.map(m => ({ ...m, id: `mat-${Date.now()}${Math.random()}`})),
        };
        
        if (jobToEdit) {
            onSave({ ...jobData, id: jobToEdit.id });
        } else {
            onSave(jobData);
        }
        onClose();
    };

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500";
    const filteredPersonnel = personnel.filter(p => p.name.toLowerCase().includes(personnelSearch.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{jobToEdit ? 'İşi Düzenle' : 'Yeni İş Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Job Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Konum / Şantiye Adı</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required className={commonInputClass} />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tarih</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={commonInputClass} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">İş Açıklaması</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required className={commonInputClass} rows={2} placeholder="Yapılan işin açıklaması..."></textarea>
                    </div>

                    {/* Personnel */}
                     <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Personel Seçimi ve Yevmiyeler</label>
                         <div className="relative">
                            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full text-left p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">{selectedPersonnelIds.length} personel seçildi</button>
                             {isDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-auto">
                                     <div className="p-2 border-b"><input type="text" placeholder="Personel ara..." value={personnelSearch} onChange={(e) => setPersonnelSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"/></div>
                                    <ul>{filteredPersonnel.map(p => (
                                        <li key={p.id} onClick={() => handlePersonnelSelect(p.id)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-gray-900">
                                            {p.name} <input type="checkbox" readOnly checked={selectedPersonnelIds.includes(p.id)} className="form-checkbox h-4 w-4 text-blue-600" />
                                        </li>
                                    ))}</ul>
                                </div>
                            )}
                        </div>
                        {selectedPersonnelIds.length > 0 && <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">{personnel.filter(p => selectedPersonnelIds.includes(p.id)).map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-gray-800">{p.name}</span>
                                <input type="number" placeholder="Yevmiye (₺)" value={personnelPayments.get(p.id) || ''} onChange={(e) => handlePaymentChange(p.id, e.target.value)} className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900" />
                            </div>
                        ))}</div>}
                    </div>
                    
                    {/* Materials */}
                    <div className="pt-4 border-t">
                         <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Malzemeler</label>
                            <button type="button" onClick={handleAddMaterial} className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-4 w-4 mr-1"/>Malzeme Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md">{materials.map((mat, index) => (
                             <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <input type="text" placeholder="Malzeme Adı" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-4 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="text" placeholder="Birim" value={mat.unit || ''} onChange={e => handleMaterialChange(index, 'unit', e.target.value)} className="col-span-1 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="number" placeholder="Adet" value={mat.quantity} onChange={e => handleMaterialChange(index, 'quantity', e.target.value)} className="col-span-2 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="number" placeholder="Birim Fiyat" value={mat.unitPrice} onChange={e => handleMaterialChange(index, 'unitPrice', e.target.value)} className="col-span-2 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="text-xs font-semibold w-16 text-right">{formatCurrency(mat.quantity * mat.unitPrice)}</span>
                                    <button type="button" onClick={() => handleRemoveMaterial(index)} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))}</div>
                    </div>
                    
                    {/* Financials */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <label htmlFor="income" className="flex items-center text-sm font-medium text-green-700"><TrendingUpIcon className="h-4 w-4 mr-1"/> Müşteri Fiyatı (Gelir)</label>
                                <input type="number" name="income" value={formData.income} onChange={handleChange} className="block w-full px-3 py-2 border border-green-300 rounded-md shadow-sm bg-green-50" />
                            </div>
                            <div className="w-28">
                                <label htmlFor="incomePaymentMethod" className="block text-sm font-medium text-gray-700">Birim</label>
                                <select name="incomePaymentMethod" value={formData.incomePaymentMethod} onChange={handleChange} className={commonInputClass}>
                                    <option value="TRY">₺ (TL)</option>
                                    <option value="USD">$ (Dolar)</option>
                                    <option value="EUR">€ (Euro)</option>
                                    <option value="GOLD">Altın</option>
                                </select>
                            </div>
                            {formData.incomePaymentMethod === 'GOLD' && (
                                <div className="w-28">
                                    <label htmlFor="incomeGoldType" className="block text-sm font-medium text-gray-700">Türü</label>
                                    <select name="incomeGoldType" value={formData.incomeGoldType} onChange={handleChange} className={commonInputClass}>
                                        <option value="gram">Gram</option>
                                        <option value="quarter">Çeyrek</option>
                                        <option value="full">Tam</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="otherExpenses" className="flex items-center text-sm font-medium text-red-700"><TrendingDownIcon className="h-4 w-4 mr-1"/> Diğer Giderler (₺)</label>
                            <input type="number" name="otherExpenses" value={formData.otherExpenses} onChange={handleChange} className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50" />
                        </div>
                    </div>
                    <div className="mt-2 bg-gray-100 p-2 rounded-md text-sm grid grid-cols-3 gap-2 text-center">
                        <div className="font-semibold text-gray-800">Personel: <span className="text-red-600">{formatCurrency(totalPersonnelPayment)}</span></div>
                        <div className="font-semibold text-gray-800">Malzeme: <span className="text-red-600">{formatCurrency(totalMaterialCost)}</span></div>
                        <div className="font-bold text-base text-gray-900">Toplam Maliyet: <span className="text-red-700">{formatCurrency(totalPersonnelPayment + totalMaterialCost + (parseFloat(formData.otherExpenses) || 0))}</span></div>
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

const JobDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onEdit: (job: CustomerJob) => void;
    onDelete: (job: CustomerJob) => void;
    job: CustomerJob | null;
    personnel: Personnel[];
}> = ({ isOpen, onClose, onEdit, onDelete, job, personnel }) => {

    if (!isOpen || !job) return null;

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

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


    const totalPersonnelCost = useMemo(() => job.personnelPayments.reduce((sum, p) => sum + p.payment, 0), [job.personnelPayments]);
    const totalMaterialCost = useMemo(() => job.materials.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0), [job.materials]);
    const totalCost = totalPersonnelCost + totalMaterialCost + job.otherExpenses;
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
                                 <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between"><dt className="text-gray-500">Personel Maliyeti:</dt><dd className="font-medium text-red-600">{formatCurrency(totalPersonnelCost)}</dd></div>
                                    <div className="flex justify-between"><dt className="text-gray-500">Malzeme Maliyeti:</dt><dd className="font-medium text-red-600">{formatCurrency(totalMaterialCost)}</dd></div>
                                    <div className="flex justify-between"><dt className="text-gray-500">Diğer Giderler:</dt><dd className="font-medium text-red-600">{formatCurrency(job.otherExpenses)}</dd></div>
                                 </dl>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Çalışan Personeller ve Hakedişleri</h4>
                                <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                                    {job.personnelIds.map(pId => {
                                        const payment = job.personnelPayments.find(p => p.personnelId === pId)?.payment || 0;
                                        return (
                                            <li key={pId} className="flex justify-between items-center">
                                                <span className="text-gray-600">{personnel.find(per => per.id === pId)?.name || 'Bilinmeyen'}</span>
                                                <span className="font-semibold">{formatCurrency(payment)}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                            {job.materials.length > 0 && <div className="bg-white p-4 rounded-lg border"><h4 className="text-md font-semibold text-gray-700 mb-2">Kullanılan Malzemeler</h4><ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{job.materials.map(m => <li key={m.id} className="grid grid-cols-3 gap-2"><span className="text-gray-600 col-span-2">{m.name}</span><span className="font-semibold text-right">{m.quantity}{m.unit ? ` ${m.unit}` : ''} x {formatCurrency(m.unitPrice)} = {formatCurrency(m.quantity*m.unitPrice)}</span></li>)}</ul></div>}
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-100 flex justify-between items-center rounded-b-xl border-t">
                         <button type="button" onClick={() => onDelete(job)} className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"><TrashIcon className="h-4 w-4 mr-2"/> Sil</button>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Kapat</button>
                            <button type="button" onClick={() => onEdit(job)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"><PencilIcon className="h-4 w-4 mr-2"/> Düzenle</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


const CustomerView: React.FC<CustomerViewProps> = (props) => {
    const { customers, customerJobs, personnel, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onAddCustomerJob, onUpdateCustomerJob, onDeleteCustomerJob, navigateToId, onNavigationComplete } = props;
    
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers.length > 0 ? customers[0] : null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState<CustomerJob | null>(null);
    const [isDeleteJobModalOpen, setIsDeleteJobModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<CustomerJob | null>(null);
    const [initialLocationForModal, setInitialLocationForModal] = useState<string | undefined>(undefined);
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

    const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
    const [jobToView, setJobToView] = useState<CustomerJob | null>(null);
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

    useEffect(() => {
        if (navigateToId) {
            const customer = customers.find(c => c.id === navigateToId);
            if (customer) {
                setSelectedCustomer(customer);
                setSearchQuery('');
            }
            onNavigationComplete();
        }
    }, [navigateToId, customers, onNavigationComplete]);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customers;
        return customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [customers, searchQuery]);
    
    useEffect(() => {
        if (selectedCustomer && !filteredCustomers.find(c => c.id === selectedCustomer.id)) {
            setSelectedCustomer(filteredCustomers.length > 0 ? filteredCustomers[0] : null);
        } else if (!selectedCustomer && filteredCustomers.length > 0) {
            setSelectedCustomer(filteredCustomers[0]);
        }
    }, [filteredCustomers, selectedCustomer]);

    const { selectedCustomerJobs, totalIncome, totalCost, netProfit } = useMemo(() => {
        if (!selectedCustomer) return { selectedCustomerJobs: [], totalIncome: 0, totalCost: 0, netProfit: 0 };
        const jobs = customerJobs.filter(j => j.customerId === selectedCustomer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const income = jobs.reduce((sum, job) => sum + job.income, 0);
        const cost = jobs.reduce((sum, job) => {
            const personnelCost = job.personnelPayments.reduce((s, p) => s + p.payment, 0);
            const materialCost = job.materials.reduce((s, m) => s + (m.quantity * m.unitPrice), 0);
            return sum + personnelCost + materialCost + job.otherExpenses;
        }, 0);
        return {
            selectedCustomerJobs: jobs,
            totalIncome: income,
            totalCost: cost,
            netProfit: income - cost
        };
    }, [selectedCustomer, customerJobs]);

    const jobsByLocation: Record<string, CustomerJob[]> = useMemo(() => {
      if (!selectedCustomerJobs) return {};
      return selectedCustomerJobs.reduce<Record<string, CustomerJob[]>>((acc, job) => {
        const location = job.location || 'Genel İşler';
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(job);
        return acc;
      }, {});
    }, [selectedCustomerJobs]);
    
    useEffect(() => {
        if (selectedCustomer && Object.keys(jobsByLocation).length > 0) {
            const firstLocation = Object.keys(jobsByLocation)[0];
            setExpandedLocations(new Set([firstLocation]));
        } else {
            setExpandedLocations(new Set());
        }
    }, [selectedCustomer, jobsByLocation]);

    const handleSaveCustomer = (data: Customer | Omit<Customer, 'id'>) => {
        if('id' in data) onUpdateCustomer(data);
        else onAddCustomer(data);
    };

    const handleConfirmDeleteCustomer = () => {
        if (customerToDelete) {
            onDeleteCustomer(customerToDelete.id);
            setIsDeleteCustomerModalOpen(false);
            setCustomerToDelete(null);
        }
    };
    
    const handleSaveJob = (data: Omit<CustomerJob, 'id'> | CustomerJob) => {
        if ('id' in data) {
            onUpdateCustomerJob(data);
        } else {
            onAddCustomerJob(data);
        }
    };

    const handleConfirmDeleteJob = () => {
        if (jobToDelete) {
            onDeleteCustomerJob(jobToDelete.id);
            setIsDeleteJobModalOpen(false);
            setJobToDelete(null);
        }
    };
    
    const handleOpenEditFromDetail = (job: CustomerJob) => {
        setIsJobDetailModalOpen(false);
        setTimeout(() => { // Allow state to update before opening next modal
            setJobToEdit(job);
            setInitialLocationForModal(job.location);
            setIsJobModalOpen(true);
        }, 50);
    };

    const handleDeleteFromDetail = (job: CustomerJob) => {
        setIsJobDetailModalOpen(false);
        setTimeout(() => {
            setJobToDelete(job);
            setIsDeleteJobModalOpen(true);
        }, 50);
    };

    const getPersonnelNames = (personnelIds: string[]) => {
        if (!personnelIds || personnelIds.length === 0) return '-';
        const names = personnelIds.map(id => personnel.find(p => p.id === id)?.name || 'Bilinmeyen');
        if (names.length > 2) {
            return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
        }
        return names.join(', ');
    }

    const getAllPersonnelNames = (personnelIds: string[]) => {
        if (!personnelIds || personnelIds.length === 0) return 'Personel atanmamış';
        return personnelIds.map(id => personnel.find(p => p.id === id)?.name || 'Bilinmeyen').join(', ');
    };

     const handleToggleLocation = (location: string) => {
        setExpandedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(location)) {
                newSet.delete(location);
            } else {
                newSet.add(location);
            }
            return newSet;
        });
    };

    return (
        <>
            <div className="flex flex-col md:flex-row h-full gap-6">
                <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center"><BuildingOffice2Icon className="h-6 w-6 mr-2 text-blue-500" />Müşteriler</h3>
                        <button onClick={() => { setCustomerToEdit(null); setIsCustomerModalOpen(true); }} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>
                    </div>
                    <div className="p-2 border-b">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute h-5 w-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Müşteri ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredCustomers.length > 0 ? (
                            <ul>{filteredCustomers.map(c => (
                                <li key={c.id}><button onClick={() => setSelectedCustomer(c)} className={`w-full text-left p-4 transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                                    <p className="font-semibold text-gray-800">{c.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.jobDescription}</p>
                                </button></li>
                            ))}</ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                               <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mb-2"/>
                               <p className="text-gray-500 font-medium">Müşteri Bulunmuyor</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="w-full md:w-2/3 lg:w-3/4">
                    {selectedCustomer ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                                        {selectedCustomer.contactInfo && <p className="text-sm text-gray-500 mt-1 flex items-center"><PhoneIcon className="h-4 w-4 mr-2"/>{selectedCustomer.contactInfo}</p>}
                                        {selectedCustomer.address && <p className="text-sm text-gray-500 mt-1 flex items-center"><MapPinIcon className="h-4 w-4 mr-2"/>{selectedCustomer.address}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setCustomerToEdit(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => { setCustomerToDelete(selectedCustomer); setIsDeleteCustomerModalOpen(true); }} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-md"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard title="Genel Toplam Gelir" value={formatCurrency(totalIncome)} icon={TrendingUpIcon} color="green" />
                                    <StatCard title="Genel Toplam Maliyet" value={formatCurrency(totalCost)} icon={TrendingDownIcon} color="red" />
                                    <StatCard title="Genel Net Kar" value={formatCurrency(netProfit)} icon={CashIcon} color={netProfit >= 0 ? 'blue' : 'red'} />
                                </div>
                            </div>
                            
                            {/* Gelen Ödemeler */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <CashIcon className="h-6 w-6 mr-3 text-green-500" />
                                    Müşteri Hakedişleri ve Gelen Ödemeler
                                </h3>
                                <div className="overflow-x-auto max-h-72">
                                    <table className="w-full text-left text-sm min-w-[500px]">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider sticky top-0">
                                            <tr>
                                                <th className="p-3 font-semibold">Tarih</th>
                                                <th className="p-3 font-semibold">İş Açıklaması</th>
                                                <th className="p-3 font-semibold text-right">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedCustomerJobs.length > 0 ? selectedCustomerJobs.map(job => (
                                                <tr key={job.id} className="hover:bg-gray-50/50">
                                                    <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(job.date)}</td>
                                                    <td className="p-3 text-gray-800 font-medium">
                                                        <span className="font-bold text-gray-600">{job.location}:</span> {job.description}
                                                    </td>
                                                    <td className="p-3 text-green-600 font-bold text-right whitespace-nowrap">{formatCurrency(job.income)}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-gray-500">Bu müşteri için gelir kaydı bulunmuyor.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">İş Lokasyonları</h3>
                                    <button onClick={() => { setJobToEdit(null); setInitialLocationForModal(undefined); setIsJobModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><PlusIcon className="h-4 w-4 mr-1"/>Yeni Konumda İş Ekle</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {Object.keys(jobsByLocation).length > 0 ? Object.entries(jobsByLocation).map(([location, jobs]) => {
                                    const isExpanded = expandedLocations.has(location);
                                    return (
                                        <div key={location} className="bg-white rounded-lg shadow-md overflow-hidden">
                                            <div onClick={() => handleToggleLocation(location)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                                <div className="flex items-center"><h4 className="font-bold text-lg text-blue-700">{location}</h4><span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{jobs.length} iş</span></div>
                                                <div className="flex items-center">
                                                    <button onClick={(e) => { e.stopPropagation(); setJobToEdit(null); setInitialLocationForModal(location); setIsJobModalOpen(true); }} className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-4 w-4 mr-1"/>İş Ekle</button>
                                                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500 ml-3"/> : <ChevronDownIcon className="h-5 w-5 text-gray-500 ml-3"/>}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-t"><div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]"><thead className="bg-gray-50"><tr>
                                                    <th className="p-3 font-semibold text-gray-600">Açıklama</th><th className="p-3 font-semibold text-gray-600 hidden sm:table-cell">Personeller</th>
                                                    <th className="p-3 font-semibold text-gray-600 text-right">Gelir</th><th className="p-3 font-semibold text-gray-600 text-right">Maliyet</th>
                                                    <th className="p-3 font-semibold text-gray-600 text-right">Kar</th></tr></thead>
                                                <tbody className="divide-y divide-gray-200">{jobs.map(job => {
                                                    const personnelCost = job.personnelPayments.reduce((s, p) => s + p.payment, 0);
                                                    const materialCost = job.materials.reduce((s, m) => s + (m.quantity * m.unitPrice), 0);
                                                    const cost = personnelCost + materialCost + job.otherExpenses;
                                                    const profit = job.income - cost;
                                                    return (<tr key={job.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => { setJobToView(job); setIsJobDetailModalOpen(true); }}>
                                                        <td className="p-3"><p className="font-medium text-gray-800 truncate max-w-[200px]" title={job.description}>{job.description}</p><p className="text-xs text-gray-500">{formatDate(job.date)}</p></td>
                                                        <td className="p-3 text-gray-600 hidden sm:table-cell" title={getAllPersonnelNames(job.personnelIds)}>{getPersonnelNames(job.personnelIds)}</td>
                                                        <td className="p-3 font-semibold text-green-600 text-right whitespace-nowrap">{formatCurrency(job.income)}</td>
                                                        <td className="p-3 font-semibold text-red-600 text-right whitespace-nowrap">{formatCurrency(cost)}</td>
                                                        <td className={`p-3 font-semibold text-right whitespace-nowrap ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                                                    </tr>);
                                                })}</tbody></table></div></div>)}
                                        </div>
                                    );
                                }) : (<div className="text-center p-6 text-gray-500 bg-white rounded-lg shadow-md">Bu müşteri için henüz iş eklenmemiş.</div>)}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md">
                            <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Müşteri Seçilmedi</p><p className="text-gray-400">Detayları görmek için bir müşteri seçin.</p>
                        </div>
                    )}
                </div>
            </div>

            <CustomerEditorModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSave={handleSaveCustomer} customerToEdit={customerToEdit} />
            <ConfirmationModal isOpen={isDeleteCustomerModalOpen} onClose={() => setIsDeleteCustomerModalOpen(false)} onConfirm={handleConfirmDeleteCustomer} title="Müşteriyi Sil" message={`'${customerToDelete?.name}' adlı müşteriyi silmek istediğinizden emin misiniz? Bu müşteriye ait tüm iş kayıtları da silinecektir.`} />
            
            {selectedCustomer && <JobEditorModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onSave={handleSaveJob} jobToEdit={jobToEdit} customerId={selectedCustomer.id} personnel={personnel} initialLocation={initialLocationForModal} />}
            <ConfirmationModal isOpen={isDeleteJobModalOpen} onClose={() => setIsDeleteJobModalOpen(false)} onConfirm={handleConfirmDeleteJob} title="İşi Sil" message={`'${jobToDelete?.description}' adlı işi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`} />

            <JobDetailModal isOpen={isJobDetailModalOpen} onClose={() => setIsJobDetailModalOpen(false)} onEdit={handleOpenEditFromDetail} onDelete={handleDeleteFromDetail} job={jobToView} personnel={personnel} />
        </>
    );
};

export default CustomerView;