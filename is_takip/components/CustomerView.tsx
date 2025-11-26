import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Customer, CustomerJob, Personnel, Material, JobPersonnelPayment, IncomePaymentMethod, GoldType, PaymentMethod, User, Role } from '../types';
import { BuildingOffice2Icon, IdentificationIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CashIcon, TrendingUpIcon, TrendingDownIcon, ChevronUpIcon, ChevronDownIcon, UsersIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

const ConfirmationModal = lazy(() => import('./ui/ConfirmationModal'));
const JobDetailModal = lazy(() => import('./JobDetailModal'));

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const paymentMethodNames: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

interface CustomerViewProps {
  currentUser: User;
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

type EditableMaterial = {
    name: string;
    unit?: string;
    quantity: string;
    unitPrice: string;
}

type EditablePersonnelPayment = {
    payment: string;
    paymentMethod: PaymentMethod;
    daysWorked: string;
}

const JobEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: Omit<CustomerJob, 'id'> | CustomerJob) => void;
    jobToEdit: CustomerJob | null;
    customerId: number;
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
    });

    const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<number[]>([]);
    const [personnelPayments, setPersonnelPayments] = useState<Map<number, EditablePersonnelPayment>>(new Map());
    const [materials, setMaterials] = useState<EditableMaterial[]>([]);
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [personnelSearch, setPersonnelSearch] = useState('');

    const handleNumericInputChange = (value: string): string => {
        if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
            return value.replace(/^0+/, '');
        }
        return value;
    };

    useEffect(() => {
        if (isOpen) {
            if (jobToEdit) {
                // Tarihi doğru formatta ayarla (YYYY-MM-DD)
                const jobDate = jobToEdit.date.includes('T') 
                    ? jobToEdit.date.split('T')[0] 
                    : jobToEdit.date;
                    
                setFormData({
                    date: jobDate,
                    location: jobToEdit.location,
                    description: jobToEdit.description,
                    income: String(jobToEdit.income || ''),
                    incomePaymentMethod: jobToEdit.incomePaymentMethod || 'TRY',
                    incomeGoldType: jobToEdit.incomeGoldType || 'gram',
                });
                setSelectedPersonnelIds(jobToEdit.personnelIds || []);
                setMaterials((jobToEdit.materials || []).map(m => ({ name: m.name, unit: m.unit, quantity: String(m.quantity), unitPrice: String(m.unitPrice) })));
                const paymentsMap = new Map<number, EditablePersonnelPayment>();
                jobToEdit.personnelPayments.forEach(p => paymentsMap.set(p.personnelId, {
                    payment: String(p.payment),
                    paymentMethod: p.paymentMethod || 'cash',
                    daysWorked: String(p.daysWorked)
                }));
                setPersonnelPayments(paymentsMap);
            } else {
                 setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: initialLocation || '',
                    description: '', 
                    income: '', 
                    incomePaymentMethod: 'TRY',
                    incomeGoldType: 'gram',
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
        return Array.from(personnelPayments.values()).reduce((sum: number, pData: EditablePersonnelPayment) => sum + (parseFloat(pData.payment) || 0), 0);
    }, [personnelPayments]);

    const totalMaterialCost = useMemo(() => {
        return materials.reduce((sum: number, mat: EditableMaterial) => sum + ((parseFloat(mat.quantity) || 0) * (parseFloat(mat.unitPrice) || 0)), 0);
    }, [materials]);

    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePersonnelSelect = (personnelId: number) => {
        const newIds = new Set(selectedPersonnelIds);
        if (newIds.has(personnelId)) {
            newIds.delete(personnelId);
        } else {
            newIds.add(personnelId);
        }
        setSelectedPersonnelIds(Array.from(newIds));
    };
    
    const handlePaymentChange = (personnelId: number, field: keyof EditablePersonnelPayment, value: string | PaymentMethod) => {
        setPersonnelPayments((prev: Map<number, EditablePersonnelPayment>) => {
            const newMap: Map<number, EditablePersonnelPayment> = new Map(prev);
            const currentData: EditablePersonnelPayment = newMap.get(personnelId) || { payment: '', paymentMethod: 'cash', daysWorked: '' };
            let processedValue = value;
            if (field === 'payment' || field === 'daysWorked') {
                processedValue = handleNumericInputChange(value as string);
            }
            const updated: EditablePersonnelPayment = {
                payment: field === 'payment' ? (processedValue as string) : currentData.payment,
                paymentMethod: field === 'paymentMethod' ? (processedValue as PaymentMethod) : currentData.paymentMethod,
                daysWorked: field === 'daysWorked' ? (processedValue as string) : currentData.daysWorked,
            };
            newMap.set(personnelId, updated);
            return newMap;
        });
    };

    const handleAddMaterial = () => {
        setMaterials(prev => [...prev, { name: '', unit: '', quantity: '1', unitPrice: '0' }]);
    };

    const handleMaterialChange = (index: number, field: keyof EditableMaterial, value: string) => {
        const newMaterials = [...materials];
        const materialToUpdate = { ...(newMaterials[index] || {}) };

        if (field === 'quantity' || field === 'unitPrice') {
           (materialToUpdate as any)[field] = handleNumericInputChange(value);
        } else {
            (materialToUpdate as any)[field] = value;
        }
        
        newMaterials[index] = materialToUpdate as EditableMaterial;
        setMaterials(newMaterials);
    };

    const handleRemoveMaterial = (index: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('=== CUSTOMER VIEW HANDLE SUBMIT DEBUG ===');
        console.log('Tüm malzemeler (filtrelemeden önce):', materials);
        
        const jobData: Omit<CustomerJob, 'id'> = {
            customerId,
            date: formData.date,
            location: formData.location,
            description: formData.description.trim() || 'İş Kaydı', // Boş açıklama için varsayılan değer
            income: parseFloat(formData.income) || 0,
            incomePaymentMethod: formData.incomePaymentMethod,
            incomeGoldType: formData.incomePaymentMethod === 'GOLD' ? formData.incomeGoldType : undefined,
            personnelIds: selectedPersonnelIds,
            personnelPayments: Array.from(personnelPayments.entries())
                .filter(([_, pData]) => (parseFloat(pData.payment) || 0) > 0 || (parseInt(pData.daysWorked) || 0) > 0)
                .map(([personnelId, pData]) => ({
                    personnelId,
                    payment: parseFloat(pData.payment) || 0,
                    paymentMethod: pData.paymentMethod,
                    daysWorked: parseInt(pData.daysWorked) || 0,
                })),
            materials: materials
                .filter(m => {
                    const isValid = m.name && m.name.trim() !== '';
                    console.log(`Malzeme "${m.name}" geçerli mi?`, isValid);
                    return isValid;
                })
                .map(m => {
                    const mapped = { 
                        id: `mat-${Date.now()}${Math.random()}`,
                        name: m.name.trim(), // Boşlukları temizle
                        unit: m.unit,
                        quantity: parseFloat(m.quantity) || 0,
                        unitPrice: parseFloat(m.unitPrice) || 0
                    };
                    console.log('Map edilen malzeme:', mapped);
                    return mapped;
                }),
        };
        
        console.log('Hazırlanan jobData:', jobData);
        console.log('jobData.materials:', jobData.materials);
        console.log('=== CUSTOMER VIEW DEBUG BİTTİ ===');
        
        // Fix: Handle create and update cases separately to prevent spreading a null object.
        if (jobToEdit) {
            onSave({ ...jobToEdit, ...jobData });
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <fieldset className="border border-gray-200 p-4 rounded-lg space-y-4">
                        <legend className="text-sm font-medium text-gray-700 px-2">İş Bilgileri</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Konum / Şantiye Adı</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} required className={commonInputClass} />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tarih</label>
                                <input type="date" name="date" value={formData.date || ''} onChange={handleChange} required className={commonInputClass} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">İş Açıklaması</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className={commonInputClass} rows={2} placeholder="Yapılan işin açıklaması..."></textarea>
                        </div>
                    </fieldset>

                    <fieldset className="border border-gray-200 p-4 rounded-lg space-y-2">
                        <legend className="text-sm font-medium text-gray-700 px-2">Personel ve Hakedişler</legend>
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
                            <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                                <span className="text-sm font-medium text-gray-800 col-span-5">{p.name}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Gün Sayısı"
                                    value={personnelPayments.get(p.id)?.daysWorked || ''}
                                    onChange={(e) => handlePaymentChange(p.id, 'daysWorked', e.target.value)}
                                    className="col-span-2 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
                                />
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Hakediş (₺)"
                                    value={personnelPayments.get(p.id)?.payment || ''}
                                    onChange={(e) => handlePaymentChange(p.id, 'payment', e.target.value)}
                                    className="col-span-2 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
                                />
                                <select
                                    value={personnelPayments.get(p.id)?.paymentMethod || 'cash'}
                                    onChange={(e) => handlePaymentChange(p.id, 'paymentMethod', e.target.value as PaymentMethod)}
                                    className="col-span-3 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
                                >
                                    <option value="cash">Nakit</option>
                                    <option value="transfer">Havale</option>
                                    <option value="card">Kart</option>
                                </select>
                            </div>
                        ))}</div>}
                    </fieldset>
                    
                    <fieldset className="border border-gray-200 p-4 rounded-lg space-y-2">
                        <legend className="text-sm font-medium text-gray-700 px-2">Malzemeler</legend>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Bu iş için kullanılan malzemeler.</span>
                            <button type="button" onClick={handleAddMaterial} className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-4 w-4 mr-1"/>Malzeme Ekle</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md">{materials.map((mat, index) => (
                             <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <input type="text" placeholder="Malzeme Adı" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-4 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="text" placeholder="Birim" value={mat.unit || ''} onChange={e => handleMaterialChange(index, 'unit', e.target.value)} className="col-span-1 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="text" inputMode="decimal" placeholder="Adet" value={mat.quantity} onChange={e => handleMaterialChange(index, 'quantity', e.target.value)} className="col-span-2 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <input type="text" inputMode="decimal" placeholder="Birim Fiyat" value={mat.unitPrice} onChange={e => handleMaterialChange(index, 'unitPrice', e.target.value)} className="col-span-2 px-2 py-1 border rounded-md text-sm bg-white text-gray-900"/>
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="text-xs font-semibold w-16 text-right">{formatCurrency((parseFloat(mat.quantity) || 0) * (parseFloat(mat.unitPrice) || 0))}</span>
                                    <button type="button" onClick={() => handleRemoveMaterial(index)} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))}</div>
                    </fieldset>
                    
                    <fieldset className="border border-gray-200 p-4 rounded-lg space-y-2">
                        <legend className="text-sm font-medium text-gray-700 px-2">Finansal</legend>
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <label htmlFor="income" className="flex items-center text-sm font-medium text-green-700"><TrendingUpIcon className="h-4 w-4 mr-1"/> Müşteri Fiyatı (Gelir)</label>
                                <input type="number" name="income" value={formData.income} onChange={handleChange} className="block w-full px-3 py-2 border border-green-300 rounded-md shadow-sm bg-green-50 text-green-900 font-bold" />
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
                        <div className="mt-2 bg-gray-100 p-2 rounded-md text-sm grid grid-cols-3 gap-2 text-center">
                            <div className="font-semibold text-gray-800">Personel: <span className="text-red-600">{formatCurrency(totalPersonnelPayment)}</span></div>
                            <div className="font-semibold text-gray-800">Malzeme: <span className="text-red-600">{formatCurrency(totalMaterialCost)}</span></div>
                            <div className="font-bold text-base text-gray-900">Toplam Maliyet: <span className="text-red-700">{formatCurrency(totalPersonnelPayment + totalMaterialCost)}</span></div>
                        </div>
                    </fieldset>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerView: React.FC<CustomerViewProps> = (props) => {
    const { currentUser, customers, customerJobs, personnel, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onAddCustomerJob, onUpdateCustomerJob, onDeleteCustomerJob, navigateToId, onNavigationComplete } = props;
    
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
    const [isIncomeHistoryExpanded, setIsIncomeHistoryExpanded] = useState(true);
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
    const isEditable = currentUser.role === Role.SUPER_ADMIN;

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

  // Müşteri güncellendiğinde (array içindeki referans değişir) detay panelinin de
  // güncel veriyi göstermesi için seçili müşteriyi yeni referansla senkronize et.
  useEffect(() => {
      if (selectedCustomer) {
          const updated = customers.find(c => c.id === selectedCustomer.id);
          if (updated && updated !== selectedCustomer) {
              setSelectedCustomer(updated);
          }
      }
  }, [customers]);

    const filteredCustomers = useMemo(() => {
        let filtered = customers;
        if (searchQuery) {
            filtered = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        // En yeni kayıtlar üstte olacak şekilde ID'ye göre sırala
        return filtered.sort((a, b) => b.id - a.id);
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
        const income = jobs.reduce((sum: number, job: CustomerJob) => sum + job.income, 0);
        const cost = jobs.reduce((sum: number, job: CustomerJob) => {
            const personnelCost = (job.personnelPayments || []).reduce((s: number, p: JobPersonnelPayment) => s + (p?.payment || 0), 0);
            const materialCost = (job.materials || []).reduce((s: number, m: Material) => s + ((m?.quantity || 0) * (m?.unitPrice || 0)), 0);
            return sum + personnelCost + materialCost;
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

    const getPersonnelNames = (personnelIds: number[]) => {
        if (!personnelIds || personnelIds.length === 0) return '-';
        const names = personnelIds.map(id => personnel.find(p => p.id === id)?.name || 'Bilinmeyen');
        if (names.length > 2) {
            return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
        }
        return names.join(', ');
    }

    const getAllPersonnelNames = (personnelIds: number[]) => {
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
                        <h3 className="text-lg font-semibold flex items-center text-gray-800"><BuildingOffice2Icon className="h-6 w-6 mr-2 text-blue-500" />Müşteriler</h3>
                        {isEditable && <button onClick={() => { setCustomerToEdit(null); setIsCustomerModalOpen(true); }} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-5 w-5 mr-1" /> Ekle</button>}
                    </div>
                    <div className="p-2 border-b">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute h-5 w-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Müşteri ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500" />
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
                                        {selectedCustomer.contactInfo && <p className="text-sm text-gray-600 mt-1 flex items-center"><PhoneIcon className="h-4 w-4 mr-2"/>{selectedCustomer.contactInfo}</p>}
                                        {selectedCustomer.address && <p className="text-sm text-gray-600 mt-1 flex items-center"><MapPinIcon className="h-4 w-4 mr-2"/>{selectedCustomer.address}</p>}
                                    </div>
                                    {isEditable && <div className="flex items-center gap-2">
                                        <button onClick={() => { setCustomerToEdit(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => { setCustomerToDelete(selectedCustomer); setIsDeleteCustomerModalOpen(true); }} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-md"><TrashIcon className="h-5 w-5"/></button>
                                    </div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard title="Genel Toplam Gelir" value={formatCurrency(totalIncome)} icon={TrendingUpIcon} color="green" />
                                    <StatCard title="Genel Toplam Maliyet" value={formatCurrency(totalCost)} icon={TrendingDownIcon} color="red" />
                                    <StatCard title="Genel Net Kar" value={formatCurrency(netProfit)} icon={CashIcon} color={netProfit >= 0 ? 'blue' : 'red'} />
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-md">
                                <div 
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-t-lg"
                                    onClick={() => setIsIncomeHistoryExpanded(!isIncomeHistoryExpanded)}
                                    role="button"
                                    aria-expanded={isIncomeHistoryExpanded}
                                >
                                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                        <CashIcon className="h-6 w-6 mr-3 text-green-500" />
                                        Müşteri Hakedişleri ve Gelen Ödemeler
                                    </h3>
                                    {isIncomeHistoryExpanded ? (
                                        <ChevronUpIcon className="h-6 w-6 text-gray-500" />
                                    ) : (
                                        <ChevronDownIcon className="h-6 w-6 text-gray-500" />
                                    )}
                                </div>
                                {isIncomeHistoryExpanded && (
                                    <div className="px-6 pb-6">
                                        <div className="overflow-x-auto max-h-72 border-t pt-4">
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
                                                            <td className="p-3 text-gray-600 whitespace-nowrap">{formatDate(job.date)}</td>
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
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">İş Lokasyonları</h3>
                        {isEditable && <button onClick={() => { setJobToEdit(null); setInitialLocationForModal(undefined); setIsJobModalOpen(true); }} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"><PlusIcon className="h-4 w-4 mr-1"/>Yeni Konumda İş Ekle</button>}
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
                                                    {isEditable && <button onClick={(e) => { e.stopPropagation(); setJobToEdit(null); setInitialLocationForModal(location); setIsJobModalOpen(true); }} className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-4 w-4 mr-1"/>İş Ekle</button>}
                                                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500 ml-3"/> : <ChevronDownIcon className="h-5 w-5 text-gray-500 ml-3"/>}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-t"><div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]"><thead className="bg-gray-50"><tr>
                                                    <th className="p-3 font-semibold text-gray-600">Açıklama</th><th className="p-3 font-semibold text-gray-600 hidden sm:table-cell">Personeller</th>
                                                    <th className="p-3 font-semibold text-gray-600 text-right">Gelir</th><th className="p-3 font-semibold text-gray-600 text-right">Maliyet</th>
                                                    <th className="p-3 font-semibold text-gray-600 text-right">Kar</th></tr></thead>
                                                <tbody className="divide-y divide-gray-200">{jobs.map(job => {
                                                    const personnelCost = (job.personnelPayments || []).reduce((s: number, p: JobPersonnelPayment) => s + (p?.payment || 0), 0);
                                                    const materialCost = (job.materials || []).reduce((s: number, m: Material) => s + ((m?.quantity || 0) * (m?.unitPrice || 0)), 0);
                                                    const cost = personnelCost + materialCost;
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

            <Suspense fallback={null}>
                {isCustomerModalOpen && <CustomerEditorModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSave={handleSaveCustomer} customerToEdit={customerToEdit} />}
                {isDeleteCustomerModalOpen && <ConfirmationModal isOpen={isDeleteCustomerModalOpen} onClose={() => setIsDeleteCustomerModalOpen(false)} onConfirm={handleConfirmDeleteCustomer} title="Müşteriyi Sil" message={`'${customerToDelete?.name}' adlı müşteriyi silmek istediğinizden emin misiniz? Bu müşteriye ait tüm iş kayıtları da silinecektir.`} />}
                
                {selectedCustomer && isJobModalOpen && <JobEditorModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onSave={handleSaveJob} jobToEdit={jobToEdit} customerId={selectedCustomer.id} personnel={personnel} initialLocation={initialLocationForModal} />}
                {isDeleteJobModalOpen && <ConfirmationModal isOpen={isDeleteJobModalOpen} onClose={() => setIsDeleteJobModalOpen(false)} onConfirm={handleConfirmDeleteJob} title="İşi Sil" message={`'${jobToDelete?.description}' adlı işi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`} />}

                {isJobDetailModalOpen && <JobDetailModal isOpen={isJobDetailModalOpen} onClose={() => setIsJobDetailModalOpen(false)} onEdit={handleOpenEditFromDetail} onDelete={handleDeleteFromDetail} job={jobToView} personnel={personnel} isEditable={isEditable} />}
            </Suspense>
        </>
    );
};

export default CustomerView;