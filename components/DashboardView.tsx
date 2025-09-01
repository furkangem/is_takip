
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Personnel, WorkDay, User, Role, Payment, Income, Expense } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon, DocumentCheckIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import StatCard from './ui/StatCard';
import ForemanPayments from './ForemanPayments';

interface DashboardViewProps {
  currentUser: User;
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  payments: Payment[];
  extraIncomes: Income[];
  extraExpenses: Expense[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  selectedMonth: Date;
}

const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, users, personnel, workDays, payments, extraIncomes, extraExpenses, onAddPayment, selectedMonth }) => {
  
  const currentMonthName = selectedMonth.toLocaleString('tr-TR', { month: 'long' });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  // ADMIN DASHBOARD
  if (currentUser.role === Role.ADMIN) {
    const { totalIncome, totalExpenses, netProfit, expensesByForeman } = useMemo(() => {
      const currentMonth = selectedMonth.getMonth();
      const currentYear = selectedMonth.getFullYear();
      
      const isCurrentMonth = (dateString: string) => {
          const date = new Date(dateString);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      const income = extraIncomes
          .filter(inc => isCurrentMonth(inc.date))
          .reduce((sum, inc) => sum + inc.amount, 0);

      const extraExp = extraExpenses
          .filter(exp => isCurrentMonth(exp.date))
          .reduce((sum, exp) => sum + exp.amount, 0);

      let personnelExp = 0;
      const byForeman: { [key: string]: { name: string, total: number } } = {};
      users.filter(u => u.role === Role.FOREMAN).forEach(f => {
          byForeman[f.id] = { name: f.name, total: 0 };
      });

      const monthlyWorkDays = workDays.filter(wd => isCurrentMonth(wd.date));
      
      monthlyWorkDays.forEach(wd => {
        const p = personnel.find(p => p.id === wd.personnelId);
        if(p) {
           personnelExp += wd.wage;
           if(byForeman[p.foremanId]) {
               byForeman[p.foremanId].total += wd.wage;
           }
        }
      });
      
      const totalExp = personnelExp + extraExp;
      const profit = income - totalExp;

      return { 
          totalIncome: income,
          totalExpenses: totalExp,
          netProfit: profit,
          personnelExpenses: personnelExp,
          expensesByForeman: Object.values(byForeman)
      };
    }, [personnel, workDays, extraIncomes, extraExpenses, users, selectedMonth]);

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
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Ustabaşına Göre Personel Giderleri</h3>
              <ul className="space-y-4">
                  {expensesByForeman.map(foreman => (
                      <li key={foreman.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="font-medium text-gray-600">{foreman.name}</span>
                          <span className="font-bold text-red-500">{formatCurrency(foreman.total)}</span>
                      </li>
                  ))}
              </ul>
          </div>
        </div>
        <div className="mt-8">
          <ForemanPayments 
            users={users}
            personnel={personnel}
            workDays={workDays}
            payments={payments}
            onAddPayment={onAddPayment}
            selectedMonth={selectedMonth}
          />
        </div>
      </div>
    );
  }

  // FOREMAN DASHBOARD
  if (currentUser.role === Role.FOREMAN) {
     const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

     const toggleRow = (personnelId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(personnelId)) {
                newSet.delete(personnelId);
            } else {
                newSet.add(personnelId);
            }
            return newSet;
        });
    };

    const { totalPersonnelDue, totalPaid, balance, personnelWorkDetails } = useMemo(() => {
      const currentMonth = selectedMonth.getMonth();
      const currentYear = selectedMonth.getFullYear();
      
      const isCurrentMonth = (dateString: string) => {
          const date = new Date(dateString);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      const foremanPersonnel = personnel.filter(p => p.foremanId === currentUser.id);

      let due = 0;
      const workDetails = foremanPersonnel.map(p => {
        const monthlyWorkDays = workDays.filter(wd => 
            wd.personnelId === p.id && isCurrentMonth(wd.date)
        ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const monthlyEarning = monthlyWorkDays.reduce((sum, wd) => sum + wd.wage, 0);
        due += monthlyEarning;

        return {
          id: p.id,
          name: p.name,
          daysWorked: monthlyWorkDays.length,
          monthlyEarning: monthlyEarning,
          workRecords: monthlyWorkDays,
        };
      });

      const paid = payments
        .filter(p => p.foremanId === currentUser.id && isCurrentMonth(p.date))
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalPersonnelDue: due,
        totalPaid: paid,
        balance: due - paid,
        personnelWorkDetails: workDetails,
      };
    }, [personnel, workDays, payments, currentUser.id, selectedMonth]);
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    return (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-700">{selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Ekip Özeti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Toplam Personel Hakedişi" 
            value={formatCurrency(totalPersonnelDue)} 
            icon={UsersIcon}
            color="blue"
          />
          <StatCard 
            title="Alınan Toplam Ödeme" 
            value={formatCurrency(totalPaid)} 
            icon={TrendingUpIcon}
            color="green"
          />
          <StatCard 
            title="Kalan Bakiye" 
            value={formatCurrency(balance)}
            icon={CashIcon}
            color={balance > 0 ? "red" : "blue"}
          />
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <DocumentCheckIcon className="h-6 w-6 mr-3 text-gray-600"/>
            Personel Çalışma Durumu
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 font-semibold text-gray-600">Personel Adı</th>
                  <th className="p-3 font-semibold text-gray-600">Konum</th>
                  <th className="p-3 font-semibold text-gray-600">İş Tanımı</th>
                  <th className="p-3 font-semibold text-gray-600 text-center">Çalışılan Gün</th>
                  <th className="p-3 font-semibold text-gray-600 text-right">Aylık Hakediş</th>
                </tr>
              </thead>
              <tbody>
                {personnelWorkDetails.map(p => (
                   <React.Fragment key={p.id}>
                    <tr 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(p.id)}
                    >
                      <td className="p-3 font-medium text-gray-800 flex items-center">
                        {expandedRows.has(p.id) ? <ChevronUpIcon className="h-4 w-4 mr-2" /> : <ChevronDownIcon className="h-4 w-4 mr-2" />}
                        {p.name}
                      </td>
                      <td className="p-3 text-gray-600 truncate max-w-xs">{p.workRecords[p.workRecords.length - 1]?.location || '-'}</td>
                      <td className="p-3 text-gray-600 truncate max-w-xs">{p.workRecords[p.workRecords.length - 1]?.jobDescription || '-'}</td>
                      <td className="p-3 text-center text-gray-600">{p.daysWorked} gün</td>
                      <td className="p-3 font-semibold text-gray-800 text-right">{formatCurrency(p.monthlyEarning)}</td>
                    </tr>
                    {expandedRows.has(p.id) && (
                        <tr className="bg-gray-50">
                            <td colSpan={5} className="p-0">
                                <div className="p-4">
                                    <h4 className="font-semibold text-gray-700 mb-2 ml-2">Çalışma Detayları:</h4>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-200">
                                            <tr>
                                                <th className="p-2 font-medium text-gray-600">Tarih</th>
                                                <th className="p-2 font-medium text-gray-600">Konum</th>
                                                <th className="p-2 font-medium text-gray-600">Yapılan İş</th>
                                                <th className="p-2 font-medium text-gray-600 text-right">Yevmiye</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {p.workRecords.map(record => (
                                                <tr key={record.id} className="border-b border-gray-200">
                                                    <td className="p-2 text-gray-700">{formatDate(record.date)}</td>
                                                    <td className="p-2 text-gray-700">{record.location}</td>
                                                    <td className="p-2 text-gray-700">{record.jobDescription}</td>
                                                    <td className="p-2 text-gray-700 font-semibold text-right">{formatCurrency(record.wage)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    )}
                   </React.Fragment>
                ))}
                {personnelWorkDetails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">Bu ay için personel çalışma verisi bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null; // Should not happen if user is authenticated
};

export default DashboardView;
