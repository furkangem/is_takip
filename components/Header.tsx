

import React from 'react';
import { User } from '../types';
import { UserCircleIcon, LogoutIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, MenuIcon } from './icons/Icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, selectedMonth, setSelectedMonth, globalSearchQuery, setGlobalSearchQuery, onMenuClick }) => {
  const getRoleName = (role: string) => {
      if (role === 'ADMIN') return 'Admin';
      if (role === 'FOREMAN') return 'Ustabaşı';
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
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10 gap-4">
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
         <button onClick={onMenuClick} className="p-1 text-gray-500 hover:text-gray-800 md:hidden" aria-label="Menüyü aç">
            <MenuIcon className="h-6 w-6" />
         </button>
         <h1 className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:block shrink-0">Personel Takip</h1>
         
         <div className="flex items-center bg-gray-100 rounded-md shrink-0">
            <button onClick={handlePrevMonth} aria-label="Önceki Ay" className="p-2 text-gray-500 hover:text-gray-800 rounded-l-md hover:bg-gray-200 transition-colors">
                <ChevronLeftIcon className="h-5 w-5"/>
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-gray-700 text-center w-32">{monthName}</span>
            <button onClick={handleNextMonth} aria-label="Sonraki Ay" className="p-2 text-gray-500 hover:text-gray-800 rounded-r-md hover:bg-gray-200 transition-colors">
                <ChevronRightIcon className="h-5 w-5"/>
            </button>
        </div>

         <div className="relative flex-1 min-w-0 ml-4 hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input 
                type="text" 
                placeholder="Genel Arama (Personel, Müşteri, İş...)"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
         </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
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