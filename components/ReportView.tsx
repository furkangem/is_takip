import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { arimoNormal } from '../utils/arimo-normal';
import { Personnel, WorkDay, User, Role, Income, Expense } from '../types';
import { CashIcon, UsersIcon, TrendingDownIcon, TrendingUpIcon, DocumentArrowDownIcon } from './icons/Icons';
import StatCard from './ui/StatCard';

interface ReportViewProps {
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  extraIncomes: Income[];
  extraExpenses: Expense[];
  selectedMonth: Date;
}

const ReportView: React.FC<ReportViewProps> = ({ users, personnel, workDays, extraIncomes, extraExpenses, selectedMonth }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const {
    totalIncome,
    totalExpenses,
    netProfit,
    personnelExpenses,
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

    let personnelExp = 0;
    const byForeman: { [key: string]: { name: string, total: number } } = {};
    users.filter(u => u.role === Role.FOREMAN).forEach(f => {
      byForeman[f.id] = { name: f.name, total: 0 };
    });

    const monthlyWorkDays = workDays.filter(wd => isCurrentMonth(wd.date));

    monthlyWorkDays.forEach(wd => {
      const p = personnel.find(p => p.id === wd.personnelId);
      if (p) {
        personnelExp += wd.wage;
        if (byForeman[p.foremanId]) {
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
      expensesByForeman: Object.values(byForeman),
      monthlyIncomes: extraIncomes.filter(inc => isCurrentMonth(inc.date)),
      monthlyExpenses: extraExpenses.filter(exp => isCurrentMonth(exp.date)),
    };
  }, [personnel, workDays, extraIncomes, extraExpenses, users, selectedMonth]);
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add font for Turkish character support
    doc.addFileToVFS('NotoSans-Regular-normal.ttf', arimoNormal);
    doc.addFont('NotoSans-Regular-normal.ttf', 'NotoSans-Regular', 'normal');
    doc.setFont('NotoSans-Regular');

    const monthStr = selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    const reportTitle = `Aylık Personel Çalışma Raporu - ${monthStr}`;

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);

    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();

    const personnelWithWork = personnel.filter(p => workDays.some(wd => {
        const workDate = new Date(wd.date);
        return wd.personnelId === p.id && workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear;
    }));

    let yPos = 35; // Start position for the first table

    personnelWithWork.forEach((p, index) => {
        const foreman = users.find(u => u.id === p.foremanId);
        
        const monthlyWorkDays = workDays.filter(wd => {
            const workDate = new Date(wd.date);
            return wd.personnelId === p.id && workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear;
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const totalDue = monthlyWorkDays.reduce((sum, wd) => sum + wd.wage, 0);

        if (yPos > 260) { // Check if new page is needed
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(`${p.name}`, 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.text(`Ustabaşı: ${foreman ? foreman.name : 'Belirtilmemiş'}`, 14, yPos);
        doc.text(`Toplam Hakediş: ${formatCurrency(totalDue)}`, 140, yPos, { align: 'left' });
        yPos += 5;

        const tableHead = [['Tarih', 'Konum', 'Yapılan İş', 'Yevmiye']];
        const tableBody = monthlyWorkDays.map(wd => [
            formatDate(wd.date),
            wd.location,
            wd.jobDescription,
            formatCurrency(wd.wage)
        ]);
        
        autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: yPos,
            theme: 'grid',
            styles: { font: 'NotoSans-Regular', fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Personel_Raporu_${monthStr.replace(' ', '_')}.pdf`);
  };

  const chartData = [
    {
      name: selectedMonth.toLocaleString('tr-TR', { month: 'long' }),
      Gelir: totalIncome,
      Gider: totalExpenses,
    },
  ];

  const TransactionTable: React.FC<{ title: string; data: (Income | Expense)[]; type: 'income' | 'expense' }> = ({ title, data, type }) => (
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
                        <tr key={item.id} className="border-b">
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
            </table>
        </div>
    </div>
);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-700">{selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Ayı Raporu</h2>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          aria-label="Raporu PDF olarak indir"
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          PDF Olarak İndir
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Toplam Gelir" value={formatCurrency(totalIncome)} icon={TrendingUpIcon} color="green" />
        <StatCard title="Toplam Gider" value={formatCurrency(totalExpenses)} icon={TrendingDownIcon} color="red" />
        <StatCard title="Personel Giderleri" value={formatCurrency(personnelExpenses)} icon={UsersIcon} color="blue" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TransactionTable title="Aylık Gelir Kalemleri" data={monthlyIncomes} type="income" />
            <TransactionTable title="Aylık Gider Kalemleri" data={monthlyExpenses} type="expense" />
      </div>
    </div>
  );
};

export default ReportView;