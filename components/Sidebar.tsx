import React from 'react';
import { DashboardIcon, UsersIcon, CurrencyDollarIcon, ChartBarIcon, CogIcon, UserIcon, DocumentTextIcon, ClipboardDocumentListIcon, BuildingOffice2Icon } from './icons/Icons';
import { User, Role } from '../types';

type View = 'dashboard' | 'personnel' | 'direct_personnel' | 'finance' | 'reports' | 'admin' | 'timesheet' | 'cashflow' | 'customers';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: DashboardIcon, roles: [Role.ADMIN, Role.FOREMAN] },
    { id: 'personnel', label: 'Personel Yönetimi', icon: UsersIcon, roles: [Role.ADMIN, Role.FOREMAN] },
    { id: 'direct_personnel', label: 'Şahsi Ekip Yönetimi', icon: UserIcon, roles: [Role.ADMIN] },
    { id: 'customers', label: 'Müşteriler', icon: BuildingOffice2Icon, roles: [Role.ADMIN] },
    { id: 'finance', label: 'Finans Yönetimi', icon: CurrencyDollarIcon, roles: [Role.ADMIN] },
    { id: 'cashflow', label: 'Nakit Akışı', icon: ClipboardDocumentListIcon, roles: [Role.ADMIN] },
    { id: 'reports', label: 'Raporlar', icon: ChartBarIcon, roles: [Role.ADMIN] },
    { id: 'timesheet', label: 'Puantaj Raporu', icon: DocumentTextIcon, roles: [Role.ADMIN] },
    { id: 'admin', label: 'Admin Paneli', icon: CogIcon, roles: [Role.ADMIN] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="w-16 md:w-64 bg-slate-800 text-white flex flex-col transition-all duration-300">
      <div className="flex items-center justify-center h-16 border-b border-slate-700">
        <span className="text-2xl font-bold text-white hidden md:block">PTS</span>
        <span className="text-2xl font-bold text-white block md:hidden">P</span>
      </div>
      <nav className="flex-1 mt-4">
        <ul>
          {visibleNavItems.map(item => (
            <li key={item.id} className="px-2 md:px-4">
              <button
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center justify-center md:justify-start p-3 my-1 rounded-lg transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="ml-4 hidden md:block font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
