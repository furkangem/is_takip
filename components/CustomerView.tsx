import React, { useState, useMemo, useEffect } from 'react';
import { Customer, CustomerJob, Personnel } from '../types';
import { BuildingOffice2Icon, IdentificationIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CashIcon, TrendingUpIcon, TrendingDownIcon, ChevronUpIcon, ChevronDownIcon, UsersIcon } from './icons/Icons';
import ConfirmationModal from './ui/ConfirmationModal';
import StatCard from './ui/StatCard';

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
    onSave: (job: Omit<CustomerJob, 'id'>) => void;
    jobToEdit: CustomerJob | null;
    customerId: string;
    personnel: Personnel[];
    initialLocation?: string;
}> = ({ isOpen, onClose, onSave, jobToEdit, customerId, personnel, initialLocation }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        operation: '',
        quantity: '',
        unit: '',
        unitPrice: '',
        income: '',
        personnelPayment: '',
        expense: '',
    });
    const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [personnelSearch, setPersonnelSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (jobToEdit) {
                setFormData({
                    date: jobToEdit.date,
                    location: jobToEdit.location,
                    operation: jobToEdit.operation,
                    quantity: String(jobToEdit.quantity),
                    unit: jobToEdit.unit,
                    unitPrice: String(jobToEdit.unitPrice),
                    income: String(jobToEdit.income),
                    personnelPayment: String(jobToEdit.personnelPayment),
                    expense: String(jobToEdit.expense),
                });
                setSelectedPersonnelIds(jobToEdit.personnelIds || []);
            } else {
                 setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: initialLocation || '',
                    operation: '',
                    quantity: '',
                    unit: '',
                    unitPrice: '',
                    income: '',
                    personnelPayment: '',
                    expense: '',
                });
                setSelectedPersonnelIds([]);
            }
            setPersonnelSearch('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, jobToEdit, initialLocation]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePersonnelSelect = (personnelId: string) => {
        setSelectedPersonnelIds(prev =>
            prev.includes(personnelId)
                ? prev.filter(id => id !== personnelId)
                : [...prev, personnelId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const jobData = {
            customerId,
            date: formData.date,
            location: formData.location,
            operation: formData.operation,
            quantity: parseFloat(formData.quantity) || 0,
            unit: formData.unit,
            unitPrice: parseFloat(formData.unitPrice) || 0,
            income: parseFloat(formData.income) || 0,
            personnelPayment: parseFloat(formData.personnelPayment) || 0,
            expense: parseFloat(formData.expense) || 0,
            personnelIds: selectedPersonnelIds,
        };

        onSave(jobData);
        onClose();
    };

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    const filteredPersonnel = personnel.filter(p => p.name.toLowerCase().includes(personnelSearch.toLowerCase()));
    const selectedPersonnel = personnel.filter(p => selectedPersonnelIds.includes(p.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{jobToEdit ? 'İşi Düzenle' : 'Yeni İş Ekle'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                        <label htmlFor="operation" className="block text-sm font-medium text-gray-700">İşlem</label>
                        <input type="text" name="operation" value={formData.operation} onChange={handleChange} required className={commonInputClass} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Adet</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={commonInputClass} />
                        </div>
                         <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Birim</label>
                            <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="m², adet, vb." className={commonInputClass} />
                        </div>
                        <div>
                            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Birim Fiyat (₺)</label>
                            <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} className={commonInputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Personel Seç</label>
                         <div className="relative">
                            <div className="w-full p-2 border border-gray-300 rounded-md bg-white min-h-[42px] cursor-text" onClick={() => setIsDropdownOpen(true)}>
                                {selectedPersonnel.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedPersonnel.map(p => (
                                            <span key={p.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                                {p.name}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handlePersonnelSelect(p.id); }} className="text-blue-600 hover:text-blue-800">
                                                    <XMarkIcon className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-500">Personel seçmek için tıklayın...</span>
                                )}
                            </div>
                             {isDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-auto">
                                     <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            placeholder="Personel ara..."
                                            value={personnelSearch}
                                            onChange={(e) => setPersonnelSearch(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <ul>{filteredPersonnel.map(p => (
                                        <li key={p.id} onClick={() => handlePersonnelSelect(p.id)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between">
                                            {p.name}
                                            <input type="checkbox" readOnly checked={selectedPersonnelIds.includes(p.id)} className="form-checkbox h-4 w-4 text-blue-600" />
                                        </li>
                                    ))}</ul>
                                    <div className="p-2 border-t text-right">
                                        <button type="button" onClick={() => setIsDropdownOpen(false)} className="px-3 py-1 text-sm bg-gray-200 rounded">Kapat</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                         <div>
                            <label htmlFor="income" className="flex items-center text-sm font-medium text-green-700"><TrendingUpIcon className="h-4 w-4 mr-1"/> Gelir (₺)</label>
                            <input type="number" name="income" value={formData.income} onChange={handleChange} required className="block w-full px-3 py-2 border border-green-300 rounded-md shadow-sm bg-green-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div>
                            <label htmlFor="personnelPayment" className="flex items-center text-sm font-medium text-red-700"><UsersIcon className="h-4 w-4 mr-1"/> Personel Maliyeti (₺)</label>
                            <input type="number" name="personnelPayment" value={formData.personnelPayment} onChange={handleChange} className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="expense" className="flex items-center text-sm font-medium text-red-700"><TrendingDownIcon className="h-4 w-4 mr-1"/> Diğer Gider (₺)</label>
                            <input type="number" name="expense" value={formData.expense} onChange={handleChange} className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500" />
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

const JobDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onEdit: (job: CustomerJob) => void;
    onDelete: (job: CustomerJob) => void;
    job: CustomerJob | null;
    personnel: Personnel[];
}> = ({ isOpen, onClose, onEdit, onDelete, job, personnel }) => {
    if (!isOpen || !job) return null;

    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

    const totalCost = job.personnelPayment + job.expense;
    const netProfit = job.income - totalCost;
    const assignedPersonnel = job.personnelIds.map(id => personnel.find(p => p.id === id)?.name).filter(Boolean);

    const DetailRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200 last:border-b-0">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 font-semibold ${className}`}>{value}</dd>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b bg-white rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{job.operation}</h3>
                        <p className="text-sm text-gray-500">{job.location}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-green-100 p-4 rounded-lg">
                            <p className="text-sm font-medium text-green-800">Müşteri Fiyatı (Gelir)</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(job.income)}</p>
                        </div>
                        <div className="bg-red-100 p-4 rounded-lg">
                             <p className="text-sm font-medium text-red-800">Toplam Maliyet</p>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-blue-100' : 'bg-red-200'}`}>
                            <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-800' : 'text-red-900'}`}>Kalan Para (Net Kar)</p>
                            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-red-800'}`}>{formatCurrency(netProfit)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="bg-white p-4 rounded-lg border">
                             <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">İş Detayları</h4>
                             <dl>
                                <DetailRow label="Tarih" value={formatDate(job.date)} />
                                <DetailRow label="Adet / Tür" value={`${job.quantity} ${job.unit}`} />
                                <DetailRow label="Birim Fiyat" value={formatCurrency(job.unitPrice)} />
                             </dl>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                             <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">Maliyet Dökümü</h4>
                             <dl>
                                <DetailRow label="Personel Maliyeti" value={formatCurrency(job.personnelPayment)} className="text-red-600" />
                                <DetailRow label="Diğer Giderler" value={formatCurrency(job.expense)} className="text-red-600" />
                             </dl>
                        </div>
                    </div>

                    {assignedPersonnel.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border">
                            <h4 className="text-md font-semibold text-gray-700 mb-2">Görevli Personel</h4>
                            <div className="flex flex-wrap gap-2">
                                {assignedPersonnel.map(name => (
                                    <span key={name} className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">{name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-100 flex justify-between items-center rounded-b-xl border-t">
                     <button type="button" onClick={() => onDelete(job)} className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">
                        <TrashIcon className="h-4 w-4 mr-2"/> Sil
                    </button>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Kapat
                        </button>
                        <button type="button" onClick={() => onEdit(job)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            <PencilIcon className="h-4 w-4 mr-2"/> Düzenle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const CustomerView: React.FC<CustomerViewProps> = (props) => {
    const { customers, customerJobs, personnel, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onAddCustomerJob, onUpdateCustomerJob, onDeleteCustomerJob } = props;
    
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
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

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
        const cost = jobs.reduce((sum, job) => sum + job.personnelPayment + job.expense, 0);
        return {
            selectedCustomerJobs: jobs,
            totalIncome: income,
            totalCost: cost,
            netProfit: income - cost
        };
    }, [selectedCustomer, customerJobs]);

    const jobsByLocation = useMemo(() => {
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
    
    const handleSaveJob = (data: Omit<CustomerJob, 'id'>) => {
        if (jobToEdit) {
            onUpdateCustomerJob({ ...data, id: jobToEdit.id });
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
        setJobToEdit(job);
        setInitialLocationForModal(job.location);
        setIsJobModalOpen(true);
    };

    const handleDeleteFromDetail = (job: CustomerJob) => {
        setIsJobDetailModalOpen(false);
        setJobToDelete(job);
        setIsDeleteJobModalOpen(true);
    };

    const getPersonnelNames = (personnelIds: string[]) => {
        if (!personnelIds || personnelIds.length === 0) return '-';
        const names = personnelIds.map(id => personnel.find(p => p.id === id)?.name || 'Bilinmeyen');
        if (names.length > 3) {
            return `${names.slice(0, 3).join(', ')} ve ${names.length - 3} diğer kişi`;
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
                                                <div className="flex items-center">
                                                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-3"/> : <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-3"/>}
                                                    <h4 className="font-bold text-lg text-blue-700">{location}</h4>
                                                    <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{jobs.length} iş</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setJobToEdit(null); setInitialLocationForModal(location); setIsJobModalOpen(true); }} className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"><PlusIcon className="h-4 w-4 mr-1"/>Bu Konuma İş Ekle</button>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-t">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="p-3 font-semibold text-gray-600">İşlem</th>
                                                                    <th className="p-3 font-semibold text-gray-600 hidden sm:table-cell">Personeller</th>
                                                                    <th className="p-3 font-semibold text-gray-600 text-right">Gelir</th>
                                                                    <th className="p-3 font-semibold text-gray-600 text-right">Maliyet</th>
                                                                    <th className="p-3 font-semibold text-gray-600 text-right">Kar</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {jobs.map(job => {
                                                                    const cost = job.personnelPayment + job.expense;
                                                                    const profit = job.income - cost;
                                                                    return (
                                                                        <tr key={job.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => { setJobToView(job); setIsJobDetailModalOpen(true); }}>
                                                                            <td className="p-3"><p className="font-medium text-gray-800">{job.operation}</p><p className="text-xs text-gray-500">{formatDate(job.date)}</p></td>
                                                                            <td className="p-3 text-gray-600 hidden sm:table-cell" title={getAllPersonnelNames(job.personnelIds)}>{getPersonnelNames(job.personnelIds)}</td>
                                                                            <td className="p-3 font-semibold text-green-600 text-right">{formatCurrency(job.income)}</td>
                                                                            <td className="p-3 font-semibold text-red-600 text-right">{formatCurrency(cost)}</td>
                                                                            <td className={`p-3 font-semibold text-right ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-6 text-gray-500 bg-white rounded-lg shadow-md">
                                        Bu müşteri için henüz iş eklenmemiş.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md">
                            <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mb-4"/>
                            <p className="text-gray-500 text-lg font-medium">Müşteri Seçilmedi</p>
                            <p className="text-gray-400">Detayları görmek için bir müşteri seçin.</p>
                        </div>
                    )}
                </div>
            </div>

            <CustomerEditorModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSave={handleSaveCustomer} customerToEdit={customerToEdit} />
            <ConfirmationModal isOpen={isDeleteCustomerModalOpen} onClose={() => setIsDeleteCustomerModalOpen(false)} onConfirm={handleConfirmDeleteCustomer} title="Müşteriyi Sil" message={`'${customerToDelete?.name}' adlı müşteriyi silmek istediğinizden emin misiniz? Bu müşteriye ait tüm iş kayıtları da silinecektir.`} />
            
            {selectedCustomer && <JobEditorModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onSave={handleSaveJob} jobToEdit={jobToEdit} customerId={selectedCustomer.id} personnel={personnel} initialLocation={initialLocationForModal} />}
            <ConfirmationModal isOpen={isDeleteJobModalOpen} onClose={() => setIsDeleteJobModalOpen(false)} onConfirm={handleConfirmDeleteJob} title="İşi Sil" message={`'${jobToDelete?.operation}' adlı işi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`} />

            <JobDetailModal 
                isOpen={isJobDetailModalOpen}
                onClose={() => setIsJobDetailModalOpen(false)}
                onEdit={handleOpenEditFromDetail}
                onDelete={handleDeleteFromDetail}
                job={jobToView}
                personnel={personnel}
            />
        </>
    );
};

export default CustomerView;