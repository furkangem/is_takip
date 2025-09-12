import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Personnel, WorkDay, User, Role, PersonnelPayment, CustomerJob } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface DashboardViewProps {
  currentUser: User;
  personnel: Personnel[];
  workDays: WorkDay[];
  personnelPayments: PersonnelPayment[];
  customerJobs: CustomerJob[];
  selectedMonth: Date;
}

const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, personnel, workDays, personnelPayments, customerJobs, selectedMonth }) => {
  
  const currentMonthName = selectedMonth.toLocaleString('tr-TR', { month: 'long' });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  // ADMIN DASHBOARD
  if (currentUser.role === Role.ADMIN) {
    const { totalIncome, totalExpenses, netProfit, topPersonnel } = useMemo(() => {
      const currentMonth = selectedMonth.getMonth();
      const currentYear = selectedMonth.getFullYear();
      
      const isCurrentMonth = (dateString: string) => {
          const date = new Date(dateString);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      const incomeFromJobs = customerJobs
          .filter(job => isCurrentMonth(job.date))
          .reduce((sum, job) => sum + job.income, 0);
          
      const personnelPaymentsTotal = personnelPayments
          .filter(p => isCurrentMonth(p.date))
          .reduce((sum, p) => sum + p.amount, 0);

      const totalPaidExpenses = personnelPaymentsTotal;
      const profit = incomeFromJobs - totalPaidExpenses;

      // Calculate top earning personnel for the month
      const monthlyWorkDays = workDays.filter(wd => isCurrentMonth(wd.date));
      const personnelEarnings: { [key: string]: { name: string, total: number } } = {};
      personnel.forEach(p => {
        personnelEarnings[p.id] = { name: p.name, total: 0 };
      });
      monthlyWorkDays.forEach(wd => {
        if (personnelEarnings[wd.personnelId]) {
           personnelEarnings[wd.personnelId].total += wd.wage;
        }
      });
      const topEarningPersonnel = Object.values(personnelEarnings)
        .filter(p => p.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      return { 
          totalIncome: incomeFromJobs,
          totalExpenses: totalPaidExpenses,
          netProfit: profit,
          topPersonnel: topEarningPersonnel,
      };
    }, [personnel, workDays, personnelPayments, customerJobs, selectedMonth]);

    const chartData = [
      {
        name: currentMonthName,
        Gelir: totalIncome,
        Gider: totalExpenses,
      },
    ];

    return (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-700">{selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Genel Bakış</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Aylık Toplam Gelir" 
            value={formatCurrency(totalIncome)} 
            icon={TrendingUpIcon}
            color="green"
          />
          <StatCard 
            title="Aylık Toplam Gider" 
            value={formatCurrency(totalExpenses)} 
            icon={TrendingDownIcon}
            color="red"
          />
          <StatCard 
            title="Net Kâr" 
            value={formatCurrency(netProfit)}
            icon={CashIcon}
            color={netProfit >= 0 ? "blue" : "red"}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Gelir & Gider Analizi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(tick) => `${(tick / 1000).toLocaleString('tr-TR')}k ₺`}/>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Gelir" fill="#4ade80" name="Aylık Gelir" />
                <Bar dataKey="Gider" fill="#f87171" name="Aylık Gider" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Ayın En Çok Kazanan Personelleri</h3>
              {topPersonnel.length > 0 ? (
                <ul className="space-y-4">
                    {topPersonnel.map(p => (
                        <li key={p.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <span className="font-medium text-gray-600">{p.name}</span>
                            <span className="font-bold text-blue-500">{formatCurrency(p.total)}</span>
                        </li>
                    ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Bu ay için veri bulunamadı.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return null; // Should not happen if user is authenticated
};

export default DashboardView;
