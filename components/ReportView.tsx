
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Personnel, WorkDay, User, Role, Income, Expense, Payment, PersonnelPayment } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface ReportViewProps {
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  payments: Payment[];
  personnelPayments: PersonnelPayment[];
  extraIncomes: Income[];
  extraExpenses: Expense[];
  selectedMonth: Date;
}

const ReportView: React.FC<ReportViewProps> = ({ users, personnel, workDays, payments, personnelPayments, extraIncomes, extraExpenses, selectedMonth }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const {
    totalIncome,
    totalExpenses,
    netProfit,
    totalPayments,
    expensesByForeman,
    monthlyIncomes,
    monthlyExpenses,
  } = useMemo(() => {
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

    const monthlyForemanPayments = payments.filter(p => isCurrentMonth(p.date));
    const monthlyPersonnelPayments = personnelPayments.filter(p => isCurrentMonth(p.date));

    const foremanPaymentsTotal = monthlyForemanPayments.reduce((sum, p) => sum + p.amount, 0);
    const personnelPaymentsTotal = monthlyPersonnelPayments.reduce((sum, p) => sum + p.amount, 0);
    const allPaymentsTotal = foremanPaymentsTotal + personnelPaymentsTotal;

    const totalExp = extraExp + allPaymentsTotal;
    const profit = income - totalExp;

    // Theoretical earnings by foreman (Hakedişler)
    const byForeman: { [key: string]: { name: string, total: number } } = {};
    users.filter(u => u.role === Role.FOREMAN).forEach(f => {
      byForeman[f.id] = { name: f.name, total: 0 };
    });
    workDays.filter(wd => isCurrentMonth(wd.date)).forEach(wd => {
      const p = personnel.find(p => p.id === wd.personnelId);
      if (p && byForeman[p.foremanId]) {
        byForeman[p.foremanId].total += wd.wage;
      }
    });
    
    // Combined list of all expenses for the table
    const combinedExpenses = [
        ...extraExpenses.filter(exp => isCurrentMonth(exp.date)),
        ...monthlyForemanPayments.map(p => {
            const foreman = users.find(u => u.id === p.foremanId);
            return { id: `pay-${p.id}`, date: p.date, description: `Ödeme: ${foreman?.name || 'Bilinmeyen Ustabaşı'}`, amount: p.amount };
        }),
        ...monthlyPersonnelPayments.map(p => {
            const pers = personnel.find(per => per.id === p.personnelId);
            return { id: `ppay-${p.id}`, date: p.date, description: `Ödeme: ${pers?.name || 'Bilinmeyen Personel'}`, amount: p.amount };
        }),
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return {
      totalIncome: income,
      totalExpenses: totalExp,
      netProfit: profit,
      totalPayments: allPaymentsTotal,
      expensesByForeman: Object.values(byForeman),
      monthlyIncomes: extraIncomes.filter(inc => isCurrentMonth(inc.date)),
      monthlyExpenses: combinedExpenses,
    };
  }, [personnel, workDays, payments, personnelPayments, extraIncomes, extraExpenses, users, selectedMonth]);
  
  const chartData = [
    {
      name: selectedMonth.toLocaleString('tr-TR', { month: 'long' }),
      Gelir: totalIncome,
      Gider: totalExpenses,
    },
  ];

  const TransactionTable: React.FC<{ title: string; data: { id: string, date: string, description: string, amount: number }[]; type: 'income' | 'expense' }> = ({ title, data, type }) => {
    const totalAmount = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);
    const totalColorClass = type === 'income' ? 'text-green-700' : 'text-red-700';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className={`text-xl font-semibold mb-4 ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 font-semibold text-gray-600">Tarih</th>
                            <th className="p-2 font-semibold text-gray-600">Açıklama</th>
                            <th className="p-2 font-semibold text-gray-600 text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(item => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 text-gray-500">{formatDate(item.date)}</td>
                                <td className="p-2 text-gray-800 font-medium">{item.description}</td>
                                <td className="p-2 text-gray-800 font-bold text-right">{formatCurrency(item.amount)}</td>
                            </tr>
                        )) : (
                            <tr>
                               <td colSpan={3} className="p-4 text-center text-gray-500">Bu ay için işlem bulunmuyor.</td>
                            </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                        <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                            <tr className="font-bold">
                                <td colSpan={2} className="p-3 text-gray-800 text-right">Toplam Tutar:</td>
                                <td className={`p-3 text-lg ${totalColorClass} text-right`}>{formatCurrency(totalAmount)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-700">{selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Raporu</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Toplam Gelir" value={formatCurrency(totalIncome)} icon={TrendingUpIcon} color="green" />
        <StatCard title="Toplam Gider" value={formatCurrency(totalExpenses)} icon={TrendingDownIcon} color="red" />
        <StatCard title="Toplam Ödemeler" value={formatCurrency(totalPayments)} icon={UsersIcon} color="blue" />
        <StatCard title="Net Kâr" value={formatCurrency(netProfit)} icon={CashIcon} color={netProfit >= 0 ? "blue" : "red"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Gelir & Gider Analizi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(tick) => `${(tick / 1000).toLocaleString('tr-TR')}k ₺`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Gelir" fill="#4ade80" name="Aylık Gelir" />
              <Bar dataKey="Gider" fill="#f87171" name="Aylık Gider" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Ustabaşı Ekibi Hakedişleri</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TransactionTable title="Aylık Gelir Kalemleri" data={monthlyIncomes} type="income" />
            <TransactionTable title="Aylık Gider Kalemleri" data={monthlyExpenses} type="expense" />
      </div>
    </div>
  );
};

export default ReportView;
