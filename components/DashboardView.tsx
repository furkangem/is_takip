import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Personnel, User, Role, PersonnelPayment, CustomerJob, Payment } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface DashboardViewProps {
  currentUser: User;
  personnel: Personnel[];
  personnelPayments: PersonnelPayment[];
  customerJobs: CustomerJob[];
  selectedMonth: Date;
  payments: Payment[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, personnel, personnelPayments, customerJobs, selectedMonth, payments }) => {
  
  const currentMonthName = selectedMonth.toLocaleString('tr-TR', { month: 'long' });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const isCurrentMonth = (dateString: string) => {
      const date = new Date(dateString);
      return date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear();
  };

  // ADMIN DASHBOARD
  if (currentUser.role === Role.ADMIN) {
    const { totalIncome, totalExpenses, netProfit, topPersonnel } = useMemo(() => {
      
      const monthlyCustomerJobs = customerJobs
          .filter(job => isCurrentMonth(job.date));
          
      const incomeFromJobs = monthlyCustomerJobs.reduce((sum, job) => sum + job.income, 0);
          
      const personnelPaymentsTotal = personnelPayments
          .filter(p => isCurrentMonth(p.date))
          .reduce((sum, p) => sum + p.amount, 0);

      const totalPaidExpenses = personnelPaymentsTotal;
      const profit = incomeFromJobs - totalPaidExpenses;

      // Calculate top earning personnel for the month
      const personnelEarnings: { [key: string]: { name: string, total: number } } = {};
      personnel.forEach(p => {
        personnelEarnings[p.id] = { name: p.name, total: 0 };
      });
      monthlyCustomerJobs.forEach(job => {
        job.personnelPayments.forEach(pPayment => {
          if(personnelEarnings[pPayment.personnelId]){
            personnelEarnings[pPayment.personnelId].total += pPayment.payment;
          }
        })
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
    }, [personnel, personnelPayments, customerJobs, selectedMonth]);

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
                <ul className="space-y-3">
                    {topPersonnel.map((p, index) => (
                        <li key={p.name} className="flex justify-between items-center p-3 bg-gray-50/80 hover:bg-gray-100 rounded-md transition-colors">
                            <div className="flex items-center">
                                <span className="text-sm font-bold text-gray-400 w-6 text-center">{index + 1}.</span>
                                <span className="font-medium text-gray-700">{p.name}</span>
                            </div>
                            <span className="font-bold text-blue-600">{formatCurrency(p.total)}</span>
                        </li>
                    ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <UsersIcon className="h-12 w-12 text-gray-300 mb-2"/>
                    <p className="text-gray-500">Bu ay için veri bulunamadı.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  // FOREMAN DASHBOARD
  if (currentUser.role === Role.FOREMAN) {
     const { teamPersonnelCount, teamTotalDue, foremanTotalPaid } = useMemo(() => {
        const teamPersonnel = personnel.filter(p => p.foremanId === currentUser.id);
        
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
                <StatCard 
                    title="Ekipteki Personel Sayısı" 
                    value={`${teamPersonnelCount}`} 
                    icon={UsersIcon}
                    color="blue"
                />
                <StatCard 
                    title="Ekibin Aylık Toplam Hakedişi" 
                    value={formatCurrency(teamTotalDue)} 
                    icon={TrendingUpIcon}
                    color="green"
                />
                <StatCard 
                    title="Size Yapılan Ödeme" 
                    value={formatCurrency(foremanTotalPaid)}
                    icon={CashIcon}
                    color="blue"
                />
            </div>
             <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-700">Bilgilendirme</h3>
                 <p className="text-gray-600">
                     Bu panel, yönettiğiniz ekibin bu ayki performansını özetlemektedir. Ekip üyelerinizin çalışma günlerini ve detaylarını görmek için sol menüdeki <strong>Ekip Yönetimi</strong> sayfasına gidebilirsiniz.
                 </p>
             </div>
        </div>
     );
  }


  return null; // Should not happen if user is authenticated
};

export default DashboardView;