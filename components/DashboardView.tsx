import React, { useState, useMemo, FC, ReactNode } from 'react';
import { Personnel, User, CustomerJob, DefterEntry, WorkDay, JobPersonnelPayment, Material } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon, BellAlertIcon, BriefcaseIcon, ExclamationTriangleIcon, SparklesIcon, ClockIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface DashboardViewProps {
  currentUser: User;
  personnel: Personnel[];
  customerJobs: CustomerJob[];
  defterEntries: DefterEntry[];
  workDays: WorkDay[];
}

// Helper Functions
const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

const getStartOfDay = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const getEndOfDay = (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };

const DashboardListCard: React.FC<{title: string, icon: React.ElementType, children: ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center border-b pb-2">
            <Icon className="h-6 w-6 mr-2 text-gray-400" />
            {title}
        </h3>
        {children}
    </div>
);


const DashboardView: FC<DashboardViewProps> = ({ personnel, customerJobs, defterEntries, workDays }) => {

  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return getStartOfDay(d);
  });
  const [endDate, setEndDate] = useState(() => getEndOfDay(new Date()));

  const report = useMemo(() => {
    // --- Filter data by date range ---
    const jobsInRange = customerJobs.filter(job => {
      const jobDate = new Date(job.date);
      return jobDate >= startDate && jobDate <= endDate;
    });

    const workDaysInRange = workDays.filter(wd => {
        const workDate = new Date(wd.date);
        return workDate >= startDate && workDate <= endDate;
    });

    // --- Calculate KPIs ---
    let totalRevenue = 0, totalPersonnelCost = 0, totalMaterialCost = 0;

    jobsInRange.forEach(job => {
      if (job.incomePaymentMethod === 'TRY' || !job.incomePaymentMethod) totalRevenue += job.income;
      // FIX: Add explicit types to the accumulator in reduce functions to prevent potential type errors during arithmetic operations.
      totalPersonnelCost += job.personnelPayments.reduce((s: number, p: JobPersonnelPayment) => s + p.payment, 0);
      totalMaterialCost += job.materials.reduce((s: number, m: Material) => s + (m.quantity * m.unitPrice), 0);
    });

    const totalCost = totalPersonnelCost + totalMaterialCost;
    const netProfit = totalRevenue - totalCost;

    // --- Prepare Lists ---
    const topProfitableJobs = jobsInRange.map(job => {
        // FIX: Add explicit types to the accumulator in reduce functions to prevent potential type errors during arithmetic operations.
        const jobCost = job.personnelPayments.reduce((s: number, p: JobPersonnelPayment) => s + p.payment, 0) + job.materials.reduce((s: number, m: Material) => s + (m.quantity * m.unitPrice), 0);
        const profit = (job.incomePaymentMethod === 'TRY' || !job.incomePaymentMethod) ? job.income - jobCost : -jobCost;
        return { ...job, profit };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5);

    const upcomingDeadlines = defterEntries.filter(e => e.status === 'unpaid' && e.dueDate).map(e => ({...e, dueDateObj: new Date(e.dueDate!)})).filter(e => e.dueDateObj >= today).sort((a,b) => a.dueDateObj.getTime() - b.dueDateObj.getTime()).slice(0, 5);
    const overdueItems = defterEntries.filter(e => e.status === 'unpaid' && e.dueDate && new Date(e.dueDate) < getStartOfDay(new Date())).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5);
    
    const activePersonnelCount = new Set(workDaysInRange.map(wd => wd.personnelId)).size;
    const mostActivePersonnel = Object.entries(workDaysInRange.reduce((acc: Record<string, number>, wd) => {
        acc[wd.personnelId] = (acc[wd.personnelId] || 0) + 1;
        return acc;
    }, {})).map(([personnelId, days]) => ({
        personnel: personnel.find(p => p.id === personnelId),
        days
    })).filter(p => p.personnel).sort((a, b) => b.days - a.days).slice(0, 5);
    
    const recentActivities = [
        ...jobsInRange.map(job => ({
            id: `job-${job.id}`,
            date: new Date(job.date),
            type: 'İş',
            Icon: BriefcaseIcon,
            color: 'blue',
            title: job.description,
            subtitle: `Gelir: ${formatCurrency(job.income)}`,
        })),
        ...defterEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        }).map(entry => ({
            id: `defter-${entry.id}`,
            date: new Date(entry.date),
            type: entry.type === 'income' ? 'Alacak' : 'Borç',
            Icon: entry.type === 'income' ? TrendingUpIcon : TrendingDownIcon,
            color: entry.type === 'income' ? 'green' : 'red',
            title: entry.description,
            subtitle: `Tutar: ${formatCurrency(entry.amount)}`,
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 7);

    return {
      kpis: { totalRevenue, totalCost, netProfit, jobCount: jobsInRange.length, activePersonnelCount, overdueCount: overdueItems.length },
      lists: { topProfitableJobs, upcomingDeadlines, overdueItems, mostActivePersonnel, recentActivities }
    };
  }, [customerJobs, defterEntries, workDays, personnel, startDate, endDate, today]);

  const [activeButton, setActiveButton] = useState('30days');
  const setDateRange = (period: 'today' | '7days' | '30days') => {
    setActiveButton(period);
    const end = getEndOfDay(new Date());
    let start = getStartOfDay(new Date());
    if (period === '7days') start.setDate(start.getDate() - 6);
    else if (period === '30days') start.setDate(start.getDate() - 29);
    setStartDate(start);
    setEndDate(end);
  };
  
  const commonBtnClass = "px-3 py-1 text-sm font-medium rounded-md transition-colors";
  const activeBtnClass = "bg-blue-600 text-white shadow";
  const inactiveBtnClass = "bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
               <h2 className="text-3xl font-bold text-gray-800">Gösterge Paneli</h2>
               <p className="text-gray-600 mt-1">İşletmenizin genel durumu, {formatDate(startDate)} - {formatDate(endDate)}</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg self-start">
              <button onClick={() => setDateRange('today')} className={`${commonBtnClass} ${activeButton === 'today' ? activeBtnClass : inactiveBtnClass}`}>Bugün</button>
              <button onClick={() => setDateRange('7days')} className={`${commonBtnClass} ${activeButton === '7days' ? activeBtnClass : inactiveBtnClass}`}>7 Gün</button>
              <button onClick={() => setDateRange('30days')} className={`${commonBtnClass} ${activeButton === '30days' ? activeBtnClass : inactiveBtnClass}`}>30 Gün</button>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Net Kâr (TRY)" value={formatCurrency(report.kpis.netProfit)} icon={CashIcon} color={report.kpis.netProfit >= 0 ? 'blue' : 'red'} />
          <StatCard title="Toplam Gelir (TRY)" value={formatCurrency(report.kpis.totalRevenue)} icon={TrendingUpIcon} color="green" />
          <StatCard title="Toplam Maliyet" value={formatCurrency(report.kpis.totalCost)} icon={TrendingDownIcon} color="red" />
          <StatCard title="Tamamlanan İşler" value={String(report.kpis.jobCount)} icon={BriefcaseIcon} color="blue" />
          <StatCard title="Aktif Personel" value={String(report.kpis.activePersonnelCount)} icon={UsersIcon} color="blue" />
          <StatCard title="Vadesi Geçen" value={String(report.kpis.overdueCount)} icon={ExclamationTriangleIcon} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
              <DashboardListCard title="En Kârlı İşler (TRY)" icon={BriefcaseIcon}>
                  <ul className="space-y-2 flex-1 overflow-y-auto">{report.lists.topProfitableJobs.map(job => (
                      <li key={job.id} className="flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 rounded-md">
                          <div>
                              <p className="font-medium text-gray-800 truncate max-w-[180px] text-sm">{job.location}</p>
                              <p className="text-xs text-gray-500">{job.description}</p>
                          </div>
                          <span className={`font-bold text-sm ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(job.profit)}</span>
                      </li>
                  ))} {report.lists.topProfitableJobs.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Veri bulunamadı.</p>}</ul>
              </DashboardListCard>
              <DashboardListCard title="En Aktif Personel" icon={SparklesIcon}>
                   <ul className="space-y-2 flex-1 overflow-y-auto">{report.lists.mostActivePersonnel.map(p => (
                      <li key={p.personnel!.id} className="flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 rounded-md">
                           <p className="font-medium text-gray-800 text-sm">{p.personnel!.name}</p>
                           <span className="font-bold text-sm text-blue-600">{p.days} gün</span>
                      </li>
                  ))} {report.lists.mostActivePersonnel.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Veri bulunamadı.</p>}</ul>
              </DashboardListCard>
          </div>
           <div className="lg:col-span-1 space-y-6">
              <DashboardListCard title="Vadesi Yaklaşanlar" icon={BellAlertIcon}>
                  <ul className="space-y-2 flex-1 overflow-y-auto">{report.lists.upcomingDeadlines.map(entry => (
                      <li key={entry.id} className="flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 rounded-md">
                           <div>
                               <p className={`font-medium text-sm ${entry.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>{entry.description}</p>
                               <p className="text-xs text-gray-500"> Vade: {formatDate(entry.dueDateObj)}</p>
                           </div>
                           <span className="font-bold text-sm text-gray-800">{formatCurrency(entry.amount)}</span>
                      </li>
                  ))} {report.lists.upcomingDeadlines.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Yaklaşan vade bulunmuyor.</p>}</ul>
              </DashboardListCard>
               <DashboardListCard title="Vadesi Geçenler" icon={ExclamationTriangleIcon}>
                  <ul className="space-y-2 flex-1 overflow-y-auto">{report.lists.overdueItems.map(entry => (
                      <li key={entry.id} className="flex justify-between items-center p-2 bg-red-50 hover:bg-red-100 rounded-md">
                           <div>
                               <p className={`font-medium text-sm text-red-800`}>{entry.description}</p>
                               <p className="text-xs text-red-600"> Vade: {formatDate(new Date(entry.dueDate!))}</p>
                           </div>
                           <span className="font-bold text-sm text-red-800">{formatCurrency(entry.amount)}</span>
                      </li>
                  ))} {report.lists.overdueItems.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Vadesi geçen görev bulunmuyor.</p>}</ul>
              </DashboardListCard>
          </div>
          <div className="lg:col-span-1">
             <DashboardListCard title="Son Aktiviteler" icon={ClockIcon}>
                <ul className="space-y-3 flex-1 overflow-y-auto">{report.lists.recentActivities.map(act => (
                    <li key={act.id} className="flex items-start gap-3">
                        <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full bg-${act.color}-100 flex items-center justify-center`}>
                            <act.Icon className={`h-5 w-5 text-${act.color}-600`} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-800 text-sm">{act.title}</p>
                            <p className="text-xs text-gray-500">{act.subtitle} - <span className="italic">{formatDate(act.date)}</span></p>
                        </div>
                    </li>
                ))} {report.lists.recentActivities.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Aktivite bulunamadı.</p>}</ul>
             </DashboardListCard>
          </div>
      </div>
    </div>
  );
}

export default DashboardView;