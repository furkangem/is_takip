import React, { useState, useMemo, useEffect } from 'react';
import { CustomerJob, Personnel, WorkDay, Customer } from '../types';
import { BriefcaseIcon, UsersIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, CalendarDaysIcon, TrendingUpIcon, DocumentArrowDownIcon } from './icons/Icons';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { NotoSansRegular } from '../utils/noto-sans-tr';


const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
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
};

interface TimeSheetViewProps {
  personnel: Personnel[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  workDays: WorkDay[];
}

const JobDetailsPanel: React.FC<{ job: CustomerJob, workDays: WorkDay[], personnel: Personnel[], customers: Customer[] }> = ({ job, workDays, personnel, customers }) => {
    const [expandedPersonnel, setExpandedPersonnel] = useState<Set<string>>(new Set());
    const customer = customers.find(c => c.id === job.customerId);

    const personnelInJob = useMemo(() => {
        const personnelMap = new Map<string, { person: Personnel; workDays: WorkDay[]; totalWage: number }>();
        workDays.forEach(wd => {
            if (wd.customerJobId === job.id) {
                if (!personnelMap.has(wd.personnelId)) {
                    const person = personnel.find(p => p.id === wd.personnelId);
                    if (person) {
                        personnelMap.set(wd.personnelId, { person, workDays: [], totalWage: 0 });
                    }
                }
                const entry = personnelMap.get(wd.personnelId);
                if (entry) {
                    entry.workDays.push(wd);
                    entry.totalWage += wd.wage;
                }
            }
        });
        return Array.from(personnelMap.values()).sort((a,b) => b.totalWage - a.totalWage);
    }, [job, workDays, personnel]);

    const togglePersonnel = (id: string) => {
        setExpandedPersonnel(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-gray-800">{job.location}</h3>
                <p className="text-gray-500">{customer?.name} - {job.description}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-md font-semibold text-green-800 flex items-center mb-3">
                    <TrendingUpIcon className="h-5 w-5 mr-2" />
                    Müşteriden Gelen Ödeme
                </h4>
                <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-600 flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                        {formatDate(job.date)}
                    </span>
                    <span className="font-bold text-green-700">
                        {formatIncome(job)}
                    </span>
                </div>
            </div>

            <div>
                 <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2" />
                    Personel Puantaj ve Hakedişleri
                </h4>
                <div className="space-y-3">
                    {personnelInJob.map(({ person, workDays, totalWage }) => (
                        <div key={person.id} className="border rounded-lg overflow-hidden">
                            <button onClick={() => togglePersonnel(person.id)} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-left">
                                <span className="font-semibold text-gray-700">{person.name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-blue-600 font-bold">{formatCurrency(totalWage)}</span>
                                    {expandedPersonnel.has(person.id) ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                                </div>
                            </button>
                            {expandedPersonnel.has(person.id) && (
                                <div className="p-3 bg-white">
                                    <ul className="divide-y divide-gray-100 text-sm">
                                        {workDays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(wd => (
                                            <li key={wd.id} className="flex justify-between items-center py-2 px-1">
                                                <div>
                                                    <span className="text-gray-600">{formatDate(wd.date)}</span>
                                                    {wd.jobDescription && <p className="text-xs text-gray-500">{wd.jobDescription}</p>}
                                                </div>
                                                <span className="font-medium text-gray-800">{formatCurrency(wd.wage)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                    {personnelInJob.length === 0 && (
                        <div className="text-center p-4 text-sm text-gray-500 bg-gray-50 rounded-md">
                            Bu işe atanmış personel puantajı bulunmamaktadır.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PersonnelDetailsPanel: React.FC<{ person: Personnel, workDays: WorkDay[], customerJobs: CustomerJob[], customers: Customer[] }> = ({ person, workDays, customerJobs, customers }) => {
    const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

    const jobsForPersonnel = useMemo(() => {
        const jobMap = new Map<string, { job: CustomerJob; workDays: WorkDay[]; totalWage: number }>();
        workDays.forEach(wd => {
            if (wd.personnelId === person.id) {
                if (!jobMap.has(wd.customerJobId)) {
                    const job = customerJobs.find(j => j.id === wd.customerJobId);
                    if (job) {
                        jobMap.set(wd.customerJobId, { job, workDays: [], totalWage: 0 });
                    }
                }
                const entry = jobMap.get(wd.customerJobId);
                if (entry) {
                    entry.workDays.push(wd);
                    entry.totalWage += wd.wage;
                }
            }
        });
        return Array.from(jobMap.values()).sort((a,b) => new Date(b.job.date).getTime() - new Date(a.job.date).getTime());
    }, [person, workDays, customerJobs]);

    const totalDays = workDays.filter(wd => wd.personnelId === person.id).length;
    const totalEarnings = jobsForPersonnel.reduce((sum: number, j) => sum + j.totalWage, 0);
    
    const toggleJob = (id: string) => {
        setExpandedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
                <h3 className="text-2xl font-bold text-gray-800">{person.name}</h3>
                <p className="text-gray-500">Çalışma ve Hakediş Dökümü</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Toplam Hakediş</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(totalEarnings)}</p>
                </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Toplam Çalışma Günü</p>
                    <p className="text-xl font-bold text-blue-600">{totalDays} gün</p>
                </div>
            </div>
             <div className="space-y-3">
                {jobsForPersonnel.map(({ job, workDays, totalWage }) => {
                     const customer = customers.find(c => c.id === job.customerId);
                     return (
                        <div key={job.id} className="border rounded-lg overflow-hidden">
                            <button onClick={() => toggleJob(job.id)} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-left">
                                <div>
                                    <p className="font-semibold text-gray-700">{job.location}</p>
                                    <p className="text-xs text-gray-500">{customer?.name}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-blue-600 font-bold">{formatCurrency(totalWage)}</span>
                                    {expandedJobs.has(job.id) ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                                </div>
                            </button>
                            {expandedJobs.has(job.id) && (
                                <div className="p-3 bg-white">
                                    <ul className="divide-y divide-gray-100 text-sm">
                                        {workDays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(wd => (
                                            <li key={wd.id} className="flex justify-between py-2 px-1">
                                                <span className="text-gray-600">{formatDate(wd.date)}</span>
                                                <span className="font-medium text-gray-800">{formatCurrency(wd.wage)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TimeSheetView: React.FC<TimeSheetViewProps> = ({ personnel, customers, customerJobs, workDays }) => {
    const [viewMode, setViewMode] = useState<'job' | 'personnel'>('job');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultStartDate = new Date('2023-01-01');
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Varsayılan tarihleri ayarla
    useEffect(() => {
        if (!startDate || !endDate) {
            setStartDate(formatDateForInput(defaultStartDate));
            setEndDate(formatDateForInput(today));
        }
    }, []);

    useEffect(() => {
        // Sadece görünüm modu değiştiğinde seçimi sıfırla
        setSelectedId(null);
        setSearchQuery('');
    }, [viewMode]);

    const filteredWorkDays = useMemo(() => {
        // Tarih filtreleme - sadece tarihler ayarlanmışsa filtrele
        if (!startDate || !endDate) {
            return workDays;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        
        return workDays.filter(wd => {
            const workDate = new Date(wd.date);
            if (start && workDate < start) return false;
            if (end && workDate > end) return false;
            return true;
        });
    }, [workDays, startDate, endDate]);

    const downloadPdfReport = async () => {
        if (isDownloadingPdf) return;
        
        setIsDownloadingPdf(true);
        try {
            const apiUrl = `/Puantaj/report/pdf?startDate=${startDate}&endDate=${endDate}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`PDF oluşturulurken hata oluştu: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Puantaj_Raporu_${startDate}_${endDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('PDF indirme hatası:', error);
            alert(`PDF indirilirken hata oluştu: ${error.message}`);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // const generatePdf = () => {
    //     const personnelData = filteredWorkDays.reduce((acc, wd) => {
    //         let entry = acc.get(wd.personnelId);
    //         if (!entry) {
    //             const person = personnel.find(p => p.id === wd.personnelId);
    //             if (person) {
    //                 entry = { name: person.name, days: 0, earnings: 0 };
    //                 acc.set(wd.personnelId, entry);
    //             }
    //         }
    //         if (entry) {
    //             entry.days += 1;
    //             entry.earnings += wd.wage;
    //         }
    //         return acc;
    //     // FIX: Explicitly typed the new Map() to resolve 'unknown' type on 'data' in the subsequent .map() call.
    //     }, new Map<string, { name: string; days: number; earnings: number }>());

    //     const puantajVerisi = Array.from(personnelData.values())
    //         .map((data: { name: string; days: number; earnings: number }, index) => ({
    //             id: index + 1,
    //             ad: data.name,
    //             gun: data.days,
    //             toplam: data.earnings
    //         }))
    //         .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));

    //     if (puantajVerisi.length === 0) {
    //         alert("Rapor oluşturmak için seçilen tarih aralığında veri bulunamadı.");
    //         return;
    //     }

    //     const doc = new jsPDF();

    //     doc.addFileToVFS('NotoSans-Regular.ttf', NotoSansRegular);
    //     doc.addFont('NotoSans-Regular.ttf', 'NotoSans-Regular', 'normal');
    //     doc.setFont('NotoSans-Regular', 'normal');

    //     doc.setFontSize(18);
    //     doc.text("Aylık Puantaj Raporu", 14, 22);
    //     doc.setFontSize(11);
    //     doc.setTextColor(100);
    //     const dateRangeText = `Tarih Aralığı: ${formatDate(startDate)} - ${formatDate(endDate)}`;
    //     doc.text(dateRangeText, 14, 29);

    //     const head = [["ID", "Personel Adı", "Çalışma Günü", "Toplam Hakediş"]];
    //     const body = puantajVerisi.map(p => [
    //         p.id,
    //         p.ad,
    //         p.gun,
    //         formatCurrency(p.toplam)
    //     ]);

    //     (doc as any).autoTable({
    //         head: head,
    //         body: body,
    //         startY: 35,
    //         styles: {
    //             font: 'NotoSans-Regular',
    //             fontStyle: 'normal'
    //         },
    //         headStyles: {
    //             font: 'NotoSans-Regular',
    //             fontStyle: 'normal',
    //             fillColor: [41, 128, 185]
    //         }
    //     });

    //     doc.save('puantaj-raporu.pdf');
    // };


    const filteredJobs = useMemo(() => customerJobs.filter(j => {
        const customer = customers.find(c => c.id === j.customerId);
        const lowerQuery = searchQuery.toLowerCase();
        return j.location.toLowerCase().includes(lowerQuery) || 
               j.description.toLowerCase().includes(lowerQuery) ||
               (customer && customer.name.toLowerCase().includes(lowerQuery));
    }).sort((a, b) => {
        // Önce tarihe göre, sonra ID'ye göre sırala (en yeni üstte)
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id - a.id;
    }), [customerJobs, customers, searchQuery]);

    const filteredPersonnel = useMemo(() => {
        let filtered = personnel;
        
        // Eğer personel görünüm modunda bir iş seçilmişse, sadece o işe atanmış personelleri göster
        if (viewMode === 'personnel') {
            // Önce seçilen öğenin iş olup olmadığını kontrol et
            const selectedJob = customerJobs.find(j => j.id === selectedId);
            if (selectedJob) {
                const personnelInSelectedJob = new Set<string>();
                filteredWorkDays.forEach(wd => {
                    if (wd.customerJobId === selectedJob.id) {
                        personnelInSelectedJob.add(wd.personnelId);
                    }
                });
                filtered = personnel.filter(p => personnelInSelectedJob.has(p.id));
            }
        }
        
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        // En yeni kayıtlar üstte olacak şekilde ID'ye göre sırala
        return filtered.sort((a, b) => b.id - a.id);
    }, [personnel, searchQuery, selectedId, viewMode, customerJobs, filteredWorkDays]);
    
    const jobsByCustomer = useMemo(() => {
        const grouped: { [key: string]: { customer: Customer, jobs: CustomerJob[] } } = {};
        filteredJobs.forEach(job => {
            const customer = customers.find(c => c.id === job.customerId);
            if (customer) {
                if (!grouped[customer.id]) {
                    grouped[customer.id] = { customer, jobs: [] };
                }
                grouped[customer.id].jobs.push(job);
            }
        });
        return Object.values(grouped);
    }, [filteredJobs, customers]);

    useEffect(() => {
        if (searchQuery) {
            const newOpenAccordions = new Set<string>();
            jobsByCustomer.forEach(group => {
                newOpenAccordions.add(group.customer.id);
            });
            setOpenAccordions(newOpenAccordions);
        }
    }, [searchQuery, jobsByCustomer]);

    useEffect(() => {
        if (jobsByCustomer.length > 0 && !searchQuery) {
            setOpenAccordions(new Set([jobsByCustomer[0].customer.id]));
        } else if (jobsByCustomer.length === 0) {
            setOpenAccordions(new Set());
        }
    }, [jobsByCustomer, searchQuery]);
    
    const toggleAccordion = (customerId: string) => {
        setOpenAccordions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(customerId)) {
                newSet.delete(customerId);
            } else {
                newSet.add(customerId);
            }
            return newSet;
        });
    };

    const selectedItem = useMemo(() => {
        if (!selectedId) return null;
        if (viewMode === 'job') return customerJobs.find(j => j.id === selectedId);
        return personnel.find(p => p.id === selectedId);
    }, [selectedId, viewMode, customerJobs, personnel]);

    const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                 <div className="p-3 bg-gray-50 border-b">
                    <div className="flex items-center justify-center space-x-2 bg-gray-200 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('job')} 
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                viewMode === 'job' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-white/60'
                            }`}
                        >
                            <BriefcaseIcon className="h-5 w-5" />
                            <span>İş'e Göre</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('personnel')} 
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                viewMode === 'personnel' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-white/60'
                            }`}
                        >
                            <UsersIcon className="h-5 w-5" />
                            <span>Personel'e Göre</span>
                        </button>
                    </div>
                </div>
                <div className="p-2 border-b">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute h-5 w-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md bg-white text-gray-900 text-sm" />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {viewMode === 'job' && (
                        <div className="space-y-1 p-2">
                            {jobsByCustomer.map(({ customer, jobs }) => {
                                const isOpen = openAccordions.has(customer.id);
                                return (
                                    <div key={customer.id}>
                                        <button onClick={() => toggleAccordion(customer.id)} className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 text-left rounded-md transition-colors">
                                            <span className="font-bold text-gray-800">{customer.name}</span>
                                            {isOpen ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                                        </button>
                                        {isOpen && (
                                            <ul className="pl-4 pt-1">
                                                {jobs.map(job => (
                                                    <li key={job.id}>
                                                        <button onClick={() => setSelectedId(job.id)} className={`w-full text-left p-3 transition-colors rounded-md ${selectedId === job.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-semibold text-gray-800 pr-2">{job.location}</span>
                                                                <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(job.date)}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 truncate">{job.description}</p>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {viewMode === 'personnel' && (
                        <div className="space-y-1 p-2">
                            {jobsByCustomer.map(({ customer, jobs }) => {
                                const isOpen = openAccordions.has(customer.id);
                                return (
                                    <div key={customer.id}>
                                        <button onClick={() => toggleAccordion(customer.id)} className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 text-left rounded-md transition-colors">
                                            <span className="font-bold text-gray-800">{customer.name}</span>
                                            {isOpen ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                                        </button>
                                        {isOpen && (
                                            <ul className="pl-4 pt-1">
                                                {jobs.map(job => (
                                                    <li key={job.id}>
                                                        <button onClick={() => setSelectedId(job.id)} className={`w-full text-left p-3 transition-colors rounded-md ${selectedId === job.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-semibold text-gray-800 pr-2">{job.location}</span>
                                                                <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(job.date)}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 truncate">{job.description}</p>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 px-3">
                                    {selectedId && customerJobs.find(j => j.id === selectedId) 
                                        ? "Bu İşe Atanmış Personeller" 
                                        : "Tüm Personeller"}
                                </h4>
                                <ul>
                                    {filteredPersonnel.map(p => (
                                        <li key={p.id}>
                                            <button onClick={() => setSelectedId(p.id)} className={`w-full text-left p-3 transition-colors ${selectedId === p.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}`}>
                                                <p className="font-semibold text-gray-800">{p.name}</p>
                                            </button>
                                        </li>
                                    ))}
                                    {filteredPersonnel.length === 0 && (
                                        <li className="p-3 text-center text-sm text-gray-500 bg-gray-50 rounded-md">
                                            {selectedId && customerJobs.find(j => j.id === selectedId) 
                                                ? "Bu işe atanmış personel bulunmamaktadır."
                                                : "Personel bulunmamaktadır."}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-2/3 lg:w-3/4 space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputClass} />
                    </div>
                    <div>
                        <button 
                            onClick={() => {
                                setStartDate(formatDateForInput(defaultStartDate));
                                setEndDate(formatDateForInput(today));
                            }}
                            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                        >
                            Varsayılan
                        </button>
                    </div>
                     <div>
                        <button 
                            onClick={downloadPdfReport} 
                            disabled={isDownloadingPdf}
                            className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                            <span>{isDownloadingPdf ? 'İndiriliyor...' : 'PDF Raporu İndir'}</span>
                        </button>
                    </div>
                </div>
                {selectedItem ? (
                    viewMode === 'job' ? (
                        <JobDetailsPanel job={selectedItem as CustomerJob} workDays={filteredWorkDays} personnel={personnel} customers={customers} />
                    ) : (
                        <PersonnelDetailsPanel person={selectedItem as Personnel} workDays={filteredWorkDays} customerJobs={customerJobs} customers={customers}/>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-[calc(100%-88px)] bg-white rounded-lg shadow-md">
                        {viewMode === 'job' ? <BriefcaseIcon className="h-16 w-16 text-gray-300 mb-4" /> : <UsersIcon className="h-16 w-16 text-gray-300 mb-4" />}
                        <p className="text-gray-500 text-lg font-medium">Detayları görmek için bir {viewMode === 'job' ? 'iş' : 'personel'} seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSheetView;