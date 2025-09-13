import React from 'react';
import { User } from '../types';
import { UserCircleIcon, LogoutIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, selectedMonth, setSelectedMonth }) => {
  const getRoleName = (role: string) => {
      if (role === 'ADMIN') return 'Admin';
      return 'Kullanıcı';
  }

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const monthName = selectedMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
      <div className="flex items-center space-x-2 sm:space-x-4">
         <h1 className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:block">Personel Takip</h1>
         <div className="flex items-center bg-gray-100 rounded-md">
            <button onClick={handlePrevMonth} aria-label="Önceki Ay" className="p-2 text-gray-500 hover:text-gray-800 rounded-l-md hover:bg-gray-200">
                <ChevronLeftIcon className="h-5 w-5"/>
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-gray-700 text-center">{monthName}</span>
            <button onClick={handleNextMonth} aria-label="Sonraki Ay" className="p-2 text-gray-500 hover:text-gray-800 rounded-r-md hover:bg-gray-200">
                <ChevronRightIcon className="h-5 w-5"/>
            </button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-8 w-8 text-gray-500" />
            <div className="hidden sm:block">
              <span className="font-semibold text-gray-700">{currentUser.name}</span>
              <span className="text-sm text-gray-500 block">{getRoleName(currentUser.role)}</span>
            </div>
          </div>
        </div>
         <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
         <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            aria-label="Çıkış Yap"
        >
            <LogoutIcon className="h-6 w-6" />
            <span className="font-medium text-sm hidden sm:block">Çıkış Yap</span>
        </button>
      </div>
    </header>
  );
};

export default Header;