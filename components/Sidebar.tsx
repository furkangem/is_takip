


import React from 'react';
import { DashboardIcon, UsersIcon, ChartBarIcon, CogIcon, DocumentTextIcon, BuildingOffice2Icon, BanknotesIcon, CalendarDaysIcon } from './icons/Icons';
import { User, Role } from '../types';
import Logo from './Logo';

type View = 'personnel' | 'reports' | 'admin' | 'customers' | 'kasa' | 'timesheet';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, isOpen }) => {
  const navItems = [
    { id: 'personnel', label: 'Personel Yönetimi', icon: UsersIcon, roles: [Role.SUPER_ADMIN, Role.VIEWER] },
    { id: 'customers', label: 'Müşteriler', icon: BuildingOffice2Icon, roles: [Role.SUPER_ADMIN, Role.VIEWER] },
    { id: 'timesheet', label: 'Puantaj', icon: CalendarDaysIcon, roles: [Role.SUPER_ADMIN, Role.VIEWER] },
    { id: 'kasa', label: 'Kasa', icon: BanknotesIcon, roles: [Role.SUPER_ADMIN, Role.VIEWER] },
    { id: 'reports', label: 'Raporlar', icon: ChartBarIcon, roles: [Role.SUPER_ADMIN, Role.VIEWER] },
    { id: 'admin', label: 'Admin Paneli', icon: CogIcon, roles: [Role.SUPER_ADMIN] },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (currentUser.email === 'baris') {
      return item.id === 'timesheet';
    }
    return item.roles.includes(currentUser.role);
  });

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-center h-16 border-b border-slate-700 shrink-0">
        <Logo />
      </div>
      <nav className="flex-1 mt-4 overflow-y-auto">
        <ul>
          {visibleNavItems.map(item => (
            <li key={item.id} className="px-4">
              <button
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="ml-4 font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;