import React, { useState, useMemo, FC } from 'react';
import { Personnel, User, Role, PersonnelPayment, CustomerJob, Payment, DefterEntry } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon, BellAlertIcon, BriefcaseIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

// Props: Add defterEntries
interface DashboardViewProps {
  currentUser: User;
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  customerJobs: CustomerJob[];
  defterEntries: DefterEntry[];
  selectedMonth: Date; // Keep for foreman view compatibility
  payments: Payment[];
}

// Helper Functions
const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

const getStartOfDay = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const getEndOfDay = (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };

const DashboardView: FC<DashboardViewProps> = ({ currentUser, personnel, customerJobs, defterEntries, selectedMonth, payments }) => {

  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return getStartOfDay(d);
  });
  const [endDate, setEndDate] = useState(() => getEndOfDay(today));

  // Admin Dashboard Logic
  const adminReport = useMemo(() => {
    const jobsInRange = customerJobs.filter(job => {
      const jobDate = new Date(job.date);
      return jobDate >= startDate && jobDate <= endDate;
    });
    
    // --- Calculate KPIs ---
    let totalRevenue = 0;
    let totalPersonnelCost = 0;
    let totalMaterialCost = 0;
    let totalOtherExpenses = 0;

    jobsInRange.forEach(job => {
      // Note: This summary simplifies currency conversion and assumes TRY for the dashboard KPIs.
      if (job.incomePaymentMethod === 'TRY' || !job.incomePaymentMethod) {
          totalRevenue += job.income;
      }
      totalPersonnelCost += job.personnelPayments.reduce((s, p) => s + p.payment, 0);
      totalMaterialCost += job.materials.reduce((s, m) => s + (m.quantity * m.unitPrice), 0);
      totalOtherExpenses += job.otherExpenses;
    });

    const totalCost = totalPersonnelCost + totalMaterialCost + totalOtherExpenses;
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // --- Prepare Lists ---
    const topProfitableJobs = jobsInRange.map(job => {
      const jobCost = job.personnelPayments.reduce((s, p) => s + p.payment, 0) +
                      job.materials.reduce((s, m) => s + (m.quantity * m.unitPrice), 0) +
                      job.otherExpenses;
      const profit = (job.incomePaymentMethod === 'TRY' || !job.incomePaymentMethod) ? job.income - jobCost : -jobCost;
      return { ...job, profit };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

    const upcomingDeadlines = defterEntries
      .filter(e => e.status === 'unpaid' && e.dueDate)
      .map(e => ({...e, dueDateObj: new Date(e.dueDate as string)}))
      .filter(e => e.dueDateObj >= today)
      .sort((a,b) => a.dueDateObj.getTime() - b.dueDateObj.getTime())
      .slice(0, 5);

    return {
      kpis: { totalRevenue, totalCost, netProfit, profitMargin, jobCount: jobsInRange.length },
      lists: { topProfitableJobs, upcomingDeadlines }
    };
  }, [customerJobs, defterEntries, startDate, endDate, today]);

  const [activeButton, setActiveButton] = useState('30days');
  const setDateRange = (period: 'today' | '7days' | '30days') => {
    setActiveButton(period);
    const end = getEndOfDay(new Date());
    let start = getStartOfDay(new Date());
    if (period === '7days') {
      start.setDate(start.getDate() - 6);
    } else if (period === '30days') {
      start.setDate(start.getDate() - 29);
    }
    setStartDate(start);
    setEndDate(end);
  };
  
  if (currentUser.role === Role.ADMIN) {
    const commonBtnClass = "px-3 py-1 text-sm font-medium rounded-md transition-colors";
    const activeBtnClass = "bg-blue-600 text-white shadow";
    const inactiveBtnClass = "bg-white text-gray-700 hover:bg-gray-50";

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                 <h2 className="text-3xl font-bold text-gray-800">Gösterge Paneli</h2>
                 <p className="text-gray-500 mt-1">İşletmenizin genel durumu, {formatDate(startDate)} - {formatDate(endDate)}</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg self-start">
                <button onClick={() => setDateRange('today')} className={`${commonBtnClass} ${activeButton === 'today' ? activeBtnClass : inactiveBtnClass}`}>Bugün</button>
                <button onClick={() => setDateRange('7days')} className={`${commonBtnClass} ${activeButton === '7days' ? activeBtnClass : inactiveBtnClass}`}>7 Gün</button>
                <button onClick={() => setDateRange('30days')} className={`${commonBtnClass} ${activeButton === '30days' ? activeBtnClass : inactiveBtnClass}`}>30 Gün</button>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <StatCard title="Toplam Gelir (TRY)" value={formatCurrency(adminReport.kpis.totalRevenue)} icon={TrendingUpIcon} color="green" />
            <StatCard title="Toplam Maliyet" value={formatCurrency(adminReport.kpis.totalCost)} icon={TrendingDownIcon} color="red" />
            <StatCard title="Net Kâr (TRY)" value={formatCurrency(adminReport.kpis.netProfit)} icon={CashIcon} color={adminReport.kpis.netProfit >= 0 ? 'blue' : 'red'} />
            <StatCard title="Tamamlanan İşler" value={String(adminReport.kpis.jobCount)} icon={BriefcaseIcon} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-700">En Kârlı İşler (TRY)</h3>
                 <ul className="space-y-3">
                     {adminReport.lists.topProfitableJobs.map(job => (
                         <li key={job.id} className="flex justify-between items-center p-3 bg-gray-50/80 hover:bg-gray-100 rounded-md">
                             <div>
                                 <p className="font-medium text-gray-800 truncate max-w-xs">{job.location}</p>
                                 <p className="text-xs text-gray-500">{job.description}</p>
                             </div>
                             <span className={`font-bold ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(job.profit)}</span>
                         </li>
                     ))}
                      {adminReport.lists.topProfitableJobs.length === 0 && <p className="text-center text-gray-500 py-4">Veri bulunamadı.</p>}
                 </ul>
             </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><BellAlertIcon className="h-6 w-6 mr-2 text-orange-500" />Vadesi Yaklaşanlar</h3>
                 <ul className="space-y-3">
                    {adminReport.lists.upcomingDeadlines.map(entry => (
                        <li key={entry.id} className="flex justify-between items-center p-3 bg-gray-50/80 hover:bg-gray-100 rounded-md">
                             <div>
                                 <p className={`font-medium ${entry.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>{entry.description}</p>
                                 <p className="text-xs text-gray-500"> Vade: {formatDate(entry.dueDateObj)}</p>
                             </div>
                             <span className="font-bold text-gray-800">{formatCurrency(entry.amount)}</span>
                        </li>
                    ))}
                    {adminReport.lists.upcomingDeadlines.length === 0 && <p className="text-center text-gray-500 py-4">Yaklaşan vade bulunmuyor.</p>}
                 </ul>
             </div>
        </div>
      </div>
    );
  }

  // Foreman dashboard remains the same as before
  if (currentUser.role === Role.FOREMAN) {
     const { teamPersonnelCount, teamTotalDue, foremanTotalPaid } = useMemo(() => {
        const teamPersonnel = personnel.filter(p => p.foremanId === currentUser.id);
        const isCurrentMonth = (dateString: string) => {
            const date = new Date(dateString);
            return date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear();
        };
        
        let totalDue = 0;
        const monthlyCustomerJobs = customerJobs.filter(job => isCurrentMonth(job.date));

        monthlyCustomerJobs.forEach(job => {
            job.personnelPayments.forEach(pPayment => {
                if(teamPersonnel.some(p => p.id === pPayment.personnelId)){
                    totalDue += pPayment.payment;
                }
            });
        });

        const foremanPayments = payments
            .filter(p => isCurrentMonth(p.date) && p.foremanId === currentUser.id)
            .reduce((sum, p) => sum + p.amount, 0);
        
        return {
            teamPersonnelCount: teamPersonnel.length,
            teamTotalDue: totalDue,
            foremanTotalPaid: foremanPayments,
        };
     }, [personnel, customerJobs, payments, currentUser, selectedMonth]);

     return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-700">{selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Ekip Özeti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Ekipteki Personel Sayısı" value={`${teamPersonnelCount}`} icon={UsersIcon} color="blue" />
                <StatCard title="Ekibin Aylık Toplam Hakedişi" value={formatCurrency(teamTotalDue)} icon={TrendingUpIcon} color="green" />
                <StatCard title="Size Yapılan Ödeme" value={formatCurrency(foremanTotalPaid)} icon={CashIcon} color="blue" />
            </div>
             <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-700">Bilgilendirme</h3>
                 <p className="text-gray-600">
                     Bu panel, yönettiğiniz ekibin bu ayki performansını özetlemektedir.
                 </p>
             </div>
        </div>
     );
  }


  return null;
}

export default DashboardView;