

import React, { useState, useMemo } from 'react';
import { User, Personnel, WorkDay, Payment, Role } from '../types';
import { CreditCardIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';

interface ForemanPaymentsProps {
  users: User[];
  personnel: Personnel[];
  workDays: WorkDay[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  selectedMonth: Date;
}

const ForemanPayments: React.FC<ForemanPaymentsProps> = ({ users, personnel, workDays, payments, onAddPayment, selectedMonth }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForeman, setSelectedForeman] = useState<User | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [expandedForemen, setExpandedForemen] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const toggleDetails = (foremanId: string) => {
    setExpandedForemen(prev => {
        const newSet = new Set(prev);
        if (newSet.has(foremanId)) {
            newSet.delete(foremanId);
        } else {
            newSet.add(foremanId);
        }
        return newSet;
    });
  };

  const foremanData = useMemo(() => {
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();
    
    const foremen = users.filter(u => u.role === Role.FOREMAN);

    return foremen.map(foreman => {
      const foremanPersonnel = personnel.filter(p => p.foremanId === foreman.id);
      
      let totalDue = 0;
      foremanPersonnel.forEach(p => {
        const monthlyWorkDays = workDays.filter(wd => {
          const workDate = new Date(wd.date);
          return wd.personnelId === p.id && workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear;
        });
        totalDue += monthlyWorkDays.reduce((sum: number, wd: WorkDay) => sum + wd.wage, 0);
      });

      const monthlyPayments = payments
        .filter(p => p.foremanId === foreman.id && new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      const totalPaid = monthlyPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

      const balance = totalDue - totalPaid;

      return {
        id: foreman.id,
        name: foreman.name,
        totalDue,
        totalPaid,
        balance,
        monthlyPayments
      };
    });
  }, [users, personnel, workDays, payments, selectedMonth]);

  const handleOpenModal = (foreman: User) => {
    setSelectedForeman(foreman);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedForeman(null);
    setPaymentAmount('');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (selectedForeman && !isNaN(amount) && amount > 0) {
      onAddPayment({
        foremanId: selectedForeman.id,
        amount: amount,
        date: new Date().toISOString(),
      });
      handleCloseModal();
    } else {
        alert('Lütfen geçerli bir tutar giriniz.')
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Ustabaşı Hakediş ve Ödemeler</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {foremanData.map(data => (
          <div key={data.id} className="border p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-lg text-gray-800">{data.name}</h4>
              <div className="my-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Toplam Hakediş:</span>
                  <span className="font-medium text-gray-700">{formatCurrency(data.totalDue)}</span>
                </div>
                <div className="text-sm">
                  <div 
                    className={`flex justify-between ${data.monthlyPayments.length > 0 ? 'cursor-pointer hover:bg-gray-100 -mx-1 px-1 rounded' : ''}`}
                    onClick={data.monthlyPayments.length > 0 ? () => toggleDetails(data.id) : undefined}
                  >
                    <span className="text-gray-500 flex items-center">
                      Ödenen Tutar:
                      {data.monthlyPayments.length > 0 && (
                        expandedForemen.has(data.id) 
                          ? <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-400" /> 
                          : <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-400" />
                      )}
                    </span>
                    <span className="font-medium text-green-600">{formatCurrency(data.totalPaid)}</span>
                  </div>
                  {expandedForemen.has(data.id) && data.monthlyPayments.length > 0 && (
                    <div className="pl-4 pt-2 mt-1 border-t border-gray-200">
                      <ul className="text-xs space-y-1">
                        {data.monthlyPayments.map(payment => (
                          <li key={payment.id} className="flex justify-between text-gray-600">
                            <span>{formatDateTime(payment.date)}</span>
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-md mt-2 pt-2 border-t">
                  <span className="font-semibold text-gray-600">Kalan Bakiye:</span>
                  <span className={`font-bold ${data.balance > 0 ? 'text-red-600' : 'text-blue-600'}`}>{formatCurrency(data.balance)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal(users.find(u => u.id === data.id)!)}
              className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Ödeme Yap
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && selectedForeman && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Ödeme Yap: {selectedForeman.name}</h4>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddPayment}>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Ödeme Tutarı (₺)</label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                autoFocus
              />
              <div className="mt-6 flex justify-end gap-3">
                 <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    İptal
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Ödemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForemanPayments;