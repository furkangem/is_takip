import React, { useState, useMemo, FC } from 'react';
import { Personnel, User, Customer, CustomerJob, PersonnelPayment } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon, DocumentArrowDownIcon } from './icons/Icons';
import StatCard from './ui/StatCard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Props (same as before, but selectedMonth won't be used)
interface ReportViewProps {
  users: User[];
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  customers: Customer[];
  customerJobs: CustomerJob[];
  selectedMonth: Date; // Keep for prop compatibility, but ignore
}

// Helper to get start of month/year
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

const ReportView: FC<ReportViewProps> = ({ personnel, customers, customerJobs }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const today = new Date();
  const [startDate, setStartDate] = useState(getStartOfMonth(today).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(getEndOfMonth(today).toISOString().split('T')[0]);

  const setDateRange = (period: 'this_month' | 'last_month' | 'this_year') => {
    const now = new Date();
    let start, end;
    switch (period) {
      case 'this_month':
        start = getStartOfMonth(now);
        end = getEndOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = getStartOfMonth(lastMonth);
        end = getEndOfMonth(lastMonth);
        break;
      case 'this_year':
        start = getStartOfYear(now);
        end = now;
        break;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const reportData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const jobsInRange = customerJobs.filter(job => {
      const jobDate = new Date(job.date);
      return jobDate >= start && jobDate <= end;
    });

    let totalIncome = 0;
    let totalCost = 0;

    const customerReport: { [id: string]: { name: string; jobCount: number; income: number; cost: number; } } = {};
    customers.forEach(c => {
        customerReport[c.id] = { name: c.name, jobCount: 0, income: 0, cost: 0 };
    });

    jobsInRange.forEach(job => {
      const personnelCost = job.personnelPayments.reduce((s, p) => s + p.payment, 0);
      const materialCost = job.materials.reduce((s, m) => s + (m.quantity * m.unitPrice), 0);
      const jobCost = personnelCost + materialCost + job.otherExpenses;
      
      totalIncome += job.income;
      totalCost += jobCost;

      if (customerReport[job.customerId]) {
        customerReport[job.customerId].jobCount++;
        customerReport[job.customerId].income += job.income;
        customerReport[job.customerId].cost += jobCost;
      }
    });

    const personnelReport: { [id: string]: { name: string; jobCount: number; earnings: number; } } = {};
    personnel.forEach(p => {
        personnelReport[p.id] = { name: p.name, jobCount: 0, earnings: 0 };
    });

    jobsInRange.forEach(job => {
        job.personnelIds.forEach(pId => {
            if (personnelReport[pId]) {
                personnelReport[pId].jobCount++;
                const paymentInfo = job.personnelPayments.find(p => p.personnelId === pId);
                if (paymentInfo) {
                    personnelReport[pId].earnings += paymentInfo.payment;
                }
            }
        });
    });

    const finalCustomerData = Object.values(customerReport)
      .filter(c => c.jobCount > 0)
      .map(c => ({...c, netProfit: c.income - c.cost, profitMargin: c.income > 0 ? ((c.income - c.cost) / c.income) * 100 : 0 }))
      .sort((a,b) => b.netProfit - a.netProfit);
      
    const finalPersonnelData = Object.values(personnelReport)
        .filter(p => p.jobCount > 0)
        .sort((a,b) => b.earnings - a.earnings);

    return {
      totalIncome,
      totalCost,
      netProfit: totalIncome - totalCost,
      jobCount: jobsInRange.length,
      customerData: finalCustomerData,
      personnelData: finalPersonnelData
    };
  }, [startDate, endDate, customerJobs, customers, personnel]);

  const generatePdf = () => {
    const doc = new jsPDF();

    // NOTE: Turkish characters may not render correctly without a custom font.
    // The custom font was removed because the font file was corrupted and causing crashes.

    doc.setFontSize(18);
    doc.text('Genel Rapor', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tarih Aralığı: ${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`, 14, 29);

    doc.setFontSize(12);
    doc.text('Özet Bilgiler', 14, 45);
    (doc as any).autoTable({
        startY: 50,
        body: [
            ['Toplam Gelir', formatCurrency(reportData.totalIncome)],
            ['Toplam Maliyet', formatCurrency(reportData.totalCost)],
            ['Net Kâr', formatCurrency(reportData.netProfit)],
            ['Tamamlanan İş Sayısı', String(reportData.jobCount)],
        ],
        theme: 'grid',
    });
    
    let lastY = (doc as any).lastAutoTable.finalY;

    doc.text('Müşteri Kârlılık Raporu', 14, lastY + 15);
    (doc as any).autoTable({
      startY: lastY + 20,
      head: [['Müşteri', 'İş Sayısı', 'Gelir', 'Maliyet', 'Net Kâr']],
      body: reportData.customerData.map(c => [
        c.name, c.jobCount, formatCurrency(c.income), formatCurrency(c.cost), formatCurrency(c.netProfit)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    });
    
    lastY = (doc as any).lastAutoTable.finalY;
    
    doc.text('Personel Hakediş Raporu', 14, lastY + 15);
    (doc as any).autoTable({
      startY: lastY + 20,
      head: [['Personel', 'İş Sayısı', 'Toplam Hakediş']],
      body: reportData.personnelData.map(p => [
        p.name, p.jobCount, formatCurrency(p.earnings)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Rapor-${startDate}-to-${endDate}.pdf`);
  };

  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      {label}
    </button>
  );
  
  const commonInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500";
  
  const commonTableClass = "w-full text-left text-sm min-w-[600px]";
  const commonTheadClass = "bg-gray-100 text-xs text-gray-500 uppercase tracking-wider";
  const commonThClass = "p-3 font-semibold";
  const commonTdClass = "p-3";


  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-700">Raporlar</h2>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={commonInputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={commonInputClass} />
                </div>
                <div className="col-span-1 lg:col-span-3 flex gap-2 items-center pt-5">
                    <button onClick={() => setDateRange('this_month')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 w-full">Bu Ay</button>
                    <button onClick={() => setDateRange('last_month')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 w-full">Geçen Ay</button>
                    <button onClick={() => setDateRange('this_year')} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 w-full">Bu Yıl</button>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="p-1 bg-gray-200 rounded-lg flex items-center space-x-1">
            <TabButton id="overview" label="Genel Bakış" />
            <TabButton id="customers" label="Müşteri Raporları" />
            <TabButton id="personnel" label="Personel Raporları" />
            <TabButton id="export" label="PDF Dışa Aktar" />
        </div>

        {/* Tab Content */}
        <div>
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Toplam Gelir" value={formatCurrency(reportData.totalIncome)} icon={TrendingUpIcon} color="green" />
                        <StatCard title="Toplam Maliyet" value={formatCurrency(reportData.totalCost)} icon={TrendingDownIcon} color="red" />
                        <StatCard title="Net Kâr" value={formatCurrency(reportData.netProfit)} icon={CashIcon} color={reportData.netProfit >= 0 ? 'blue' : 'red'} />
                        <StatCard title="Yapılan İş Sayısı" value={String(reportData.jobCount)} icon={UsersIcon} color="blue" />
                    </div>
                </div>
            )}
            
            {activeTab === 'customers' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className={commonTableClass}>
                            <thead className={commonTheadClass}>
                                <tr>
                                    <th className={commonThClass}>Müşteri</th>
                                    <th className={commonThClass} align="right">İş Sayısı</th>
                                    <th className={commonThClass} align="right">Gelir</th>
                                    <th className={commonThClass} align="right">Maliyet</th>
                                    <th className={commonThClass} align="right">Net Kâr</th>
                                    <th className={commonThClass} align="right">Kâr Marjı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.customerData.map(c => (
                                    <tr key={c.name} className="hover:bg-gray-50/50">
                                        <td className={`${commonTdClass} font-medium text-gray-800`}>{c.name}</td>
                                        <td className={commonTdClass} align="right">{c.jobCount}</td>
                                        <td className={`${commonTdClass} text-green-600`} align="right">{formatCurrency(c.income)}</td>
                                        <td className={`${commonTdClass} text-red-600`} align="right">{formatCurrency(c.cost)}</td>
                                        <td className={`${commonTdClass} font-bold ${c.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} align="right">{formatCurrency(c.netProfit)}</td>
                                        <td className={commonTdClass} align="right">{c.profitMargin.toFixed(1)}%</td>
                                    </tr>
                                ))}
                                {reportData.customerData.length === 0 && (
                                    <tr><td colSpan={6} className="text-center p-6 text-gray-500">Seçilen tarih aralığında veri bulunamadı.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'personnel' && (
                 <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className={commonTableClass}>
                            <thead className={commonTheadClass}>
                                <tr>
                                    <th className={commonThClass}>Personel</th>
                                    <th className={commonThClass} align="right">Çalıştığı İş Sayısı</th>
                                    <th className={commonThClass} align="right">Toplam Hakediş</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.personnelData.map(p => (
                                    <tr key={p.name} className="hover:bg-gray-50/50">
                                        <td className={`${commonTdClass} font-medium text-gray-800`}>{p.name}</td>
                                        <td className={commonTdClass} align="right">{p.jobCount}</td>
                                        <td className={`${commonTdClass} font-bold text-blue-600`} align="right">{formatCurrency(p.earnings)}</td>
                                    </tr>
                                ))}
                                {reportData.personnelData.length === 0 && (
                                    <tr><td colSpan={3} className="text-center p-6 text-gray-500">Seçilen tarih aralığında veri bulunamadı.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'export' && (
                <div className="bg-white p-10 rounded-lg shadow-md text-center">
                    <DocumentArrowDownIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800">PDF Raporu Oluştur</h3>
                    <p className="text-gray-500 mt-2 mb-6">Seçili tarih aralığı için özet raporu oluşturup indirin.</p>
                    <button
                        onClick={generatePdf}
                        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Raporu İndir
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ReportView;