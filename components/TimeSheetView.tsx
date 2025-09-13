import React, { useMemo, useState } from 'react';
import { Personnel, WorkDay } from '../types';
import { UserGroupIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';

interface TimeSheetViewProps {
  personnel: Personnel[];
  workDays: WorkDay[];
  selectedMonth: Date;
}

const TimeSheetView: React.FC<TimeSheetViewProps> = ({ personnel, workDays, selectedMonth }) => {
  const [expandedPersonnel, setExpandedPersonnel] = useState<Set<string>>(new Set());

  const togglePersonnel = (personnelId: string) => {
    setExpandedPersonnel(prev => {
        const newSet = new Set(prev);
        if (newSet.has(personnelId)) {
            newSet.delete(personnelId);
        } else {
            newSet.add(personnelId);
        }
        return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const personnelData = useMemo(() => {
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();

    return personnel
        .map(p => {
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
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a,b) => a.name.localeCompare(b.name));
  }, [personnel, workDays, selectedMonth]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-700">Aylık Puantaj Raporu</h2>
      </div>

      <div className="space-y-2">
        {personnelData.length > 0 ? personnelData.map(p => {
          const isExpanded = expandedPersonnel.has(p.id);
          return (
          <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePersonnel(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePersonnel(p.id); } }}
                  aria-expanded={isExpanded}
                  aria-controls={`personnel-details-${p.id}`}
              >
                  <h4 className="font-bold text-lg text-gray-800">{p.name}</h4>
                  <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 hidden sm:inline">{p.totalDays} gün</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(p.totalEarnings)}</span>
                      {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
                  </div>
              </div>
              {isExpanded && (
              <div id={`personnel-details-${p.id}`} className="px-4 pb-4">
                  <div className="overflow-x-auto border-t pt-2">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100">
                      <tr>
                          <th className="p-2 font-semibold text-gray-600">Tarih</th>
                          <th className="p-2 font-semibold text-gray-600 hidden md:table-cell">Konum</th>
                          <th className="p-2 font-semibold text-gray-600">Yapılan İş</th>
                          <th className="p-2 font-semibold text-gray-600 text-center">Saat</th>
                          <th className="p-2 font-semibold text-gray-600 text-right">Yevmiye</th>
                      </tr>
                      </thead>
                      <tbody>
                      {p.workRecords.map(wd => (
                          <tr key={wd.id} className="border-b">
                          <td className="p-2 text-gray-600">{formatDate(wd.date)}</td>
                          <td className="p-2 text-gray-800 hidden md:table-cell">{wd.location}</td>
                          <td className="p-2 text-gray-800">{wd.jobDescription}</td>
                          <td className="p-2 text-gray-600 text-center">{wd.hours || 8} saat</td>
                          <td className="p-2 font-semibold text-gray-800 text-right">{formatCurrency(wd.wage)}</td>
                          </tr>
                      ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                      <tr className="font-bold">
                          <td colSpan={2} className="p-2 text-gray-700 text-right md:hidden">Aylık Toplam:</td>
                          <td colSpan={3} className="p-2 text-gray-700 text-right hidden md:table-cell">Aylık Toplam:</td>
                          <td className="p-2 text-gray-800 text-center">{p.totalHours} saat</td>
                          <td className="p-2 text-gray-800 text-right">{formatCurrency(p.totalEarnings)}</td>
                      </tr>
                      </tfoot>
                  </table>
                  </div>
              </div>
              )}
          </div>
          );
        }) : (
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