import React, { useMemo } from 'react';
import { Personnel, WorkDay, User, Role } from '../types';
import { UserGroupIcon } from './icons/Icons';

interface TimeSheetViewProps {
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  selectedMonth: Date;
}

const TimeSheetView: React.FC<TimeSheetViewProps> = ({ users, personnel, workDays, selectedMonth }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const dataByForeman = useMemo(() => {
    const foremen = users.filter(u => u.role === Role.FOREMAN);
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();

    return foremen.map(foreman => {
        const foremanPersonnel = personnel
            .map(p => {
                if(p.foremanId !== foreman.id) return null;

                const monthlyWorkDays = workDays.filter(wd => {
                    const workDate = new Date(wd.date);
                    return wd.personnelId === p.id && workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear;
                }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                if (monthlyWorkDays.length === 0) return null;

                const totalDays = monthlyWorkDays.length;
                const totalHours = monthlyWorkDays.reduce((sum, wd) => sum + (wd.hours || 8), 0);
                const totalEarnings = monthlyWorkDays.reduce((sum, wd) => sum + wd.wage, 0);

                return {
                    ...p,
                    workRecords: monthlyWorkDays,
                    totalDays,
                    totalHours,
                    totalEarnings,
                };
            }).filter((p): p is NonNullable<typeof p> => p !== null);

        if (foremanPersonnel.length === 0) return null;

        return {
            ...foreman,
            personnel: foremanPersonnel,
        };
    }).filter((f): f is NonNullable<typeof f> => f !== null);
  }, [users, personnel, workDays, selectedMonth]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-700">Aylık Puantaj Raporu</h2>
      </div>

      <div className="space-y-8">
        {dataByForeman.length > 0 ? dataByForeman.map(foreman => (
          <div key={foreman.id}>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200">{foreman.name}</h3>
            <div className="space-y-6">
              {foreman.personnel.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-md">
                  <h4 className="font-bold text-lg text-gray-800 mb-3">{p.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 font-semibold text-gray-600">Tarih</th>
                          <th className="p-2 font-semibold text-gray-600">Konum</th>
                          <th className="p-2 font-semibold text-gray-600">Yapılan İş</th>
                          <th className="p-2 font-semibold text-gray-600 text-center">Saat</th>
                          <th className="p-2 font-semibold text-gray-600 text-right">Yevmiye</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.workRecords.map(wd => (
                          <tr key={wd.id} className="border-b">
                            <td className="p-2 text-gray-600">{formatDate(wd.date)}</td>
                            <td className="p-2 text-gray-800">{wd.location}</td>
                            <td className="p-2 text-gray-800">{wd.jobDescription}</td>
                            <td className="p-2 text-gray-600 text-center">{wd.hours || 8} saat</td>
                            <td className="p-2 font-semibold text-gray-800 text-right">{formatCurrency(wd.wage)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-bold">
                          <td colSpan={3} className="p-2 text-gray-700 text-right">Aylık Toplam:</td>
                          <td className="p-2 text-gray-800 text-center">{p.totalHours} saat</td>
                          <td className="p-2 text-gray-800 text-right">{formatCurrency(p.totalEarnings)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md p-10">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Veri Bulunamadı</p>
            <p className="text-gray-400 text-center">Seçilen ay ({selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}) için puantaj kaydı bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSheetView;